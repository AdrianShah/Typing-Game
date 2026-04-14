import { mutationGeneric as mutation, actionGeneric as action, internalMutationGeneric as internalMutation, queryGeneric as query } from 'convex/server';
import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { getRandomWords } from './words.js';

// Replicating penalty scoring formula on server to prevent client cheating
const PENALTY_MODE_CONSTANTS = {
  ACCURACY_WEIGHT: 0.8,
  WPM_WEIGHT: 0.2,
  WPM_NORMALIZATION_BASELINE: 150 
};

function calculatePenaltyScore(netWPM, accuracy) {
  const normalizedWPM = Math.min(netWPM / PENALTY_MODE_CONSTANTS.WPM_NORMALIZATION_BASELINE, 1.0);
  const normalizedAccuracy = (accuracy > 0 ? accuracy : 0) / 100;
  return ((normalizedWPM * PENALTY_MODE_CONSTANTS.WPM_WEIGHT) + 
          (normalizedAccuracy * PENALTY_MODE_CONSTANTS.ACCURACY_WEIGHT)) * 10000;
}

export const startRound = mutation({
  args: { roomId: v.id('multiplayerRooms'), hostUid: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error('Room not found');
    if (room.hostUid !== args.hostUid) throw new Error('Only host can start the match');
    if (room.status !== 'waiting') throw new Error('Match is already active or finished');

    const participants = await ctx.db
      .query('roomParticipants')
      .withIndex('by_roomId', (q) => q.eq('roomId', args.roomId))
      .collect();

    const allReady = participants.every(p => p.ready);
    if (!allReady && participants.length > 1) { // allow 1-person testing if host really wants
      throw new Error('Not all participants are ready');
    }

    // Determine current round count
    const rounds = await ctx.db
      .query('rounds')
      .withIndex('by_roomId', (q) => q.eq('roomId', args.roomId))
      .collect();
    const roundNumber = rounds.length + 1;

    // Generate word payload (approx 200 words for standard match)
    const words = getRandomWords(300, room.difficulty);
    const wordListText = words.join(' ');

    const delayMs = 3000; // 3 seconds sync countdown
    const startedAt = Date.now() + delayMs;
    const endsAt = startedAt + (room.mode * 1000); 

    const roundId = await ctx.db.insert('rounds', {
      roomId: room._id,
      roundNumber,
      status: 'active',
      wordListText,
      startedAt,
      endsAt,
      createdAt: Date.now(),
    });

    await ctx.db.patch(room._id, {
      status: 'active',
      activeRoundId: roundId,
    });

    // Schedule auto-finalization hook with 5 second grace
    await ctx.scheduler.runAfter(
      delayMs + (room.mode * 1000) + 5000, 
      internal.multiplayerMatch.autoFinalizeRound, 
      { roundId }
    );

    return { roundId, startedAt, endsAt };
  }
});

export const submitRoundAttempt = mutation({
  args: {
    roundId: v.id('rounds'),
    participantId: v.id('roomParticipants'),
    grossWPM: v.number(),
    netWPM: v.number(),
    accuracy: v.number(),
    errors: v.number(),
    correctWords: v.number(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error('Round not found');
    if (round.status !== 'active') throw new Error('Round is not active');

    const participant = await ctx.db.get(args.participantId);
    if (!participant || participant.roomId !== round.roomId) {
      throw new Error('Participant invalid');
    }

    // Check if within time bounds + grace period
    const now = Date.now();
    if (now > round.endsAt + 10000) {
      throw new Error('Submission window closed');
    }

    // Sanity check inputs
    if (args.grossWPM < 0 || args.grossWPM > 400 || args.accuracy < 0 || args.accuracy > 100) {
      throw new Error('Implausible metrics submitted');
    }

    // Check if already submitted
    const existing = await ctx.db
      .query('roundAttempts')
      .withIndex('by_roundId_participantId', (q) => 
        q.eq('roundId', args.roundId).eq('participantId', args.participantId)
      )
      .first();
    
    if (existing) {
      // Idempotent retry, do nothing, just return success
      return { success: true };
    }

    await ctx.db.insert('roundAttempts', {
      roundId: args.roundId,
      participantId: args.participantId,
      grossWPM: args.grossWPM,
      netWPM: args.netWPM,
      accuracy: args.accuracy,
      errors: args.errors,
      correctWords: args.correctWords,
      completedAt: Date.now(),
    });

    // Trigger finalization if all participants have submitted
    const participants = await ctx.db
      .query('roomParticipants')
      .withIndex('by_roomId', (q) => q.eq('roomId', round.roomId))
      .collect();

    const attempts = await ctx.db
      .query('roundAttempts')
      .withIndex('by_roundId', (q) => q.eq('roundId', args.roundId))
      .collect();

    if (attempts.length >= participants.length) {
      await ctx.scheduler.runAfter(0, internal.multiplayerMatch.finalizeRoundResults, { roundId: round._id });
    }

    return { success: true };
  }
});

// Host explicit reset to rematch
export const restartMatchState = mutation({
  args: { roomId: v.id('multiplayerRooms'), hostUid: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error('Room not found');
    if (room.hostUid !== args.hostUid) throw new Error('Only host can rematch');
    if (room.status !== 'finished') throw new Error('Match must be finished before rematch');

    // Make sure we have new config version to reset everyone
    await ctx.db.patch(room._id, {
      status: 'waiting',
      activeRoundId: undefined, // Explicit nullification of id
      roomConfigVersion: room.roomConfigVersion + 1
    });

    const participants = await ctx.db
        .query('roomParticipants')
        .withIndex('by_roomId', (q) => q.eq('roomId', args.roomId))
        .collect();

    for (const p of participants) {
        await ctx.db.patch(p._id, { ready: false });
    }
  }
});

// Finalization internal hooks
export const autoFinalizeRound = internalMutation({
  args: { roundId: v.id('rounds') },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.status === 'finished') return; // Already finalized

    await finalizeRoundLogic(ctx, round);
  }
});

export const finalizeRoundResults = internalMutation({
  args: { roundId: v.id('rounds') },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.status === 'finished') return;

    await finalizeRoundLogic(ctx, round);
  }
});

async function finalizeRoundLogic(ctx, round) {
  const room = await ctx.db.get(round.roomId);
  if (!room) return;

  const participants = await ctx.db
    .query('roomParticipants')
    .withIndex('by_roomId', (q) => q.eq('roomId', room._id))
    .collect();

  const attempts = await ctx.db
    .query('roundAttempts')
    .withIndex('by_roundId', (q) => q.eq('roundId', round._id))
    .collect();

  const standings = participants.map(p => {
    const attempt = attempts.find(a => a.participantId === p._id);
    
    // Process score depending on game mode
    let rankingScore = 0;
    if (attempt) {
        if (room.matchType === 'penalty') {
            rankingScore = calculatePenaltyScore(attempt.netWPM, attempt.accuracy);
        } else {
            rankingScore = attempt.netWPM * 10000; // Regular primary is WPM
        }
    }

    return {
      participantId: p._id,
      player: p.player,
      grossWPM: attempt ? attempt.grossWPM : 0,
      netWPM: attempt ? attempt.netWPM : 0,
      accuracy: attempt ? attempt.accuracy : 0,
      correctWords: attempt ? attempt.correctWords : 0,
      rankingScore,
      dnf: !attempt,
    };
  });

  // Sort standings based on match logic
  standings.sort((a, b) => {
    if (a.dnf && !b.dnf) return 1;
    if (!a.dnf && b.dnf) return -1;
    
    if (a.rankingScore !== b.rankingScore) {
       return b.rankingScore - a.rankingScore;
    }

    // Tie-breakers
    if (room.matchType === 'penalty') {
       if (a.netWPM !== b.netWPM) return b.netWPM - a.netWPM; // 1st tiebreaker
    } else {
       if (a.correctWords !== b.correctWords) return b.correctWords - a.correctWords;
       if (a.accuracy !== b.accuracy) return b.accuracy - a.accuracy;
    }

    return 0; // Pure tie
  });

  // Assign position properly handling ties
  let currentRank = 1;
  for (let i = 0; i < standings.length; i++) {
     if (i > 0 && 
         standings[i].rankingScore === standings[i-1].rankingScore &&
         standings[i].dnf === standings[i-1].dnf) {
           standings[i].position = standings[i-1].position;
     } else {
           standings[i].position = currentRank;
     }
     currentRank++;
  }

  await ctx.db.insert('roundResults', {
    roundId: round._id,
    standings,
    completedAt: Date.now()
  });

  await ctx.db.patch(round._id, { status: 'finished' });
  await ctx.db.patch(room._id, { status: 'finished' });
}