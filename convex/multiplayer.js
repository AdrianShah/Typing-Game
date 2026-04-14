import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server';
import { v } from 'convex/values';

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const createMultiplayerRoom = mutation({
  args: {
    hostUid: v.string(),
    mode: v.number(),
    difficulty: v.string(),
    matchType: v.string(), // "regular" or "penalty"
    maxParticipants: v.number(),
    hostPlayerName: v.string(),
    hostIcon: v.string(),
    hostCountry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const roomCode = generateRoomCode();
    const roomId = await ctx.db.insert('multiplayerRooms', {
      hostUid: args.hostUid,
      roomCode,
      mode: args.mode,
      difficulty: args.difficulty,
      matchType: args.matchType,
      status: 'waiting',
      maxParticipants: args.maxParticipants,
      roomConfigVersion: 1,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 2, // 2 hours
    });

    const participantId = await ctx.db.insert('roomParticipants', {
      roomId,
      uid: args.hostUid,
      player: args.hostPlayerName,
      icon: args.hostIcon,
      country: args.hostCountry,
      ready: true,
      joinedAt: Date.now(),
      lastSeenAt: Date.now(),
    });

    return { roomCode, roomId, participantId };
  },
});

export const getRoomByCode = query({
  args: { roomCode: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query('multiplayerRooms')
      .withIndex('by_roomCode', (q) => q.eq('roomCode', args.roomCode.toUpperCase()))
      .first();
    
    if (!room) return null;
    return room;
  }
});

export const getRoomDetails = query({
  args: { roomId: v.id('multiplayerRooms') },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const participants = await ctx.db
      .query('roomParticipants')
      .withIndex('by_roomId', (q) => q.eq('roomId', args.roomId))
      .collect();

    // Check if there is an active round
    let activeRound = null;
    if (room.activeRoundId) {
      activeRound = await ctx.db.get(room.activeRoundId);
    }
      
    return { room, participants, activeRound };
  }
});

export const joinRoomByCode = mutation({
  args: {
    roomCode: v.string(),
    uid: v.optional(v.string()),
    guestId: v.optional(v.string()),
    player: v.string(),
    icon: v.string(),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query('multiplayerRooms')
      .withIndex('by_roomCode', (q) => q.eq('roomCode', args.roomCode.toUpperCase()))
      .first();
    
    if (!room) throw new Error('Room not found');
    if (room.status !== 'waiting') throw new Error('Match in progress or finished');

    const participants = await ctx.db
      .query('roomParticipants')
      .withIndex('by_roomId', (q) => q.eq('roomId', room._id))
      .collect();
      
    if (participants.length >= room.maxParticipants) {
      throw new Error('Room is full');
    }

    // Check if exactly same participant already exists
    const existing = participants.find(p => 
      (args.uid && p.uid === args.uid) || 
      (args.guestId && p.guestId === args.guestId)
    );

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeenAt: Date.now(),
        player: args.player,
        icon: args.icon,
        country: args.country
      });
      return { roomId: room._id, participantId: existing._id };
    }

    const participantId = await ctx.db.insert('roomParticipants', {
      roomId: room._id,
      uid: args.uid,
      guestId: args.guestId,
      player: args.player,
      icon: args.icon,
      country: args.country,
      ready: false,
      joinedAt: Date.now(),
      lastSeenAt: Date.now(),
    });

    return { roomId: room._id, participantId };
  }
});

export const leaveRoom = mutation({
  args: { participantId: v.id('roomParticipants') },
  handler: async (ctx, args) => {
    const participant = await ctx.db.get(args.participantId);
    if (!participant) return;

    await ctx.db.delete(args.participantId);

    const room = await ctx.db.get(participant.roomId);
    if (!room) return;

    // If host leaves, try to promote new host or close
    if (participant.uid === room.hostUid) {
      const remaining = await ctx.db
        .query('roomParticipants')
        .withIndex('by_roomId', (q) => q.eq('roomId', room._id))
        .collect();
      
      if (remaining.length > 0) {
        // Promote first available signed-in user, else first guest
        const newHost = remaining.find(p => p.uid) || remaining[0];
        await ctx.db.patch(room._id, { hostUid: newHost.uid || newHost.guestId });
      } else {
        await ctx.db.patch(room._id, { status: 'finished' });
      }
    }
  }
});

export const setReadyStatus = mutation({
  args: { participantId: v.id('roomParticipants'), ready: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.participantId, { ready: args.ready, lastSeenAt: Date.now() });
  }
});

export const updateRoomConfig = mutation({
  args: {
    roomId: v.id('multiplayerRooms'),
    hostUid: v.string(),
    mode: v.number(),
    difficulty: v.string(),
    matchType: v.string(),
    maxParticipants: v.number(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error('Room not found');
    if (room.hostUid !== args.hostUid) throw new Error('Only host can update config');

    await ctx.db.patch(args.roomId, {
      mode: args.mode,
      difficulty: args.difficulty,
      matchType: args.matchType,
      maxParticipants: args.maxParticipants,
      roomConfigVersion: room.roomConfigVersion + 1,
    });

    // Reset everyone's ready status
    const participants = await ctx.db
      .query('roomParticipants')
      .withIndex('by_roomId', (q) => q.eq('roomId', args.roomId))
      .collect();
    
    for (const p of participants) {
      if (p.uid !== args.hostUid) { // Optional: keep host ready
        await ctx.db.patch(p._id, { ready: false });
      }
    }
  }
});

export const kickParticipant = mutation({
  args: { roomId: v.id('multiplayerRooms'), hostUid: v.string(), targetId: v.id('roomParticipants') },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error('Room not found');
    if (room.hostUid !== args.hostUid) throw new Error('Only host can kick');

    const target = await ctx.db.get(args.targetId);
    if (target && target.roomId === args.roomId && target._id !== args.hostUid) {
      await ctx.db.delete(args.targetId);
    }
  }
});

export const closeRoom = mutation({
  args: { roomId: v.id('multiplayerRooms'), hostUid: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (room && room.hostUid === args.hostUid) {
      await ctx.db.patch(args.roomId, { status: 'finished' });
    }
  }
});

export const updateHeartbeat = mutation({
  args: { participantId: v.id('roomParticipants') },
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.participantId);
    if (p) {
      await ctx.db.patch(args.participantId, { lastSeenAt: Date.now() });
    }
  }
});