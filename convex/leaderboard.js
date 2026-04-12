import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server';
import { v } from 'convex/values';

export const createRunSession = mutation({
  args: {
    uid: v.string(),
    mode: v.number(),
    difficulty: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('runSessions', {
      uid: args.uid,
      mode: args.mode,
      difficulty: args.difficulty,
      createdAt: Date.now(),
    });
  },
});

export const submitRun = mutation({
  args: {
    sessionId: v.id('runSessions'),
    uid: v.string(),
    player: v.string(),
    icon: v.string(),
    country: v.string(),
    mode: v.number(),
    difficulty: v.string(),
    netWPM: v.number(),
    grossWPM: v.number(),
    acc: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.uid !== args.uid) {
      throw new Error('Invalid run session.');
    }
    if (session.consumedAt) {
      throw new Error('Run session already consumed.');
    }

    const userRuns = await ctx.db
      .query('runs')
      .withIndex('by_uid', (q) => q.eq('uid', args.uid))
      .collect();

    const previousBest = userRuns
      .filter((run) => run.mode === args.mode && run.difficulty === args.difficulty)
      .sort((left, right) => right.netWPM - left.netWPM)[0] || null;

    if (previousBest && args.netWPM <= previousBest.netWPM) {
      await ctx.db.patch(args.sessionId, {
        consumedAt: Date.now(),
      });

      return {
        accepted: false,
        personalBest: previousBest.netWPM,
        message: `Run complete! Beat your personal best of ${Math.round(previousBest.netWPM)} to update the leaderboard.`,
      };
    }

    await ctx.db.patch(args.sessionId, {
      consumedAt: Date.now(),
    });

    const runId = await ctx.db.insert('runs', {
      uid: args.uid,
      player: args.player,
      icon: args.icon,
      country: args.country,
      mode: args.mode,
      difficulty: args.difficulty,
      netWPM: args.netWPM,
      grossWPM: args.grossWPM,
      acc: args.acc,
      timestamp: Date.now(),
      sessionId: args.sessionId,
    });

    return {
      accepted: true,
      runId,
      personalBest: args.netWPM,
    };
  },
});

export const getTopRuns = query({
  args: {
    mode: v.number(),
    difficulty: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('runs')
      .withIndex('by_mode_difficulty_netWPM', (q) =>
        q.eq('mode', args.mode).eq('difficulty', args.difficulty),
      )
      .order('desc')
      .take(10);
  },
});

export const fetchCountryProgression = query({
  args: {
    uid: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.uid) {
      return { progressions: [] };
    }

    const runs = await ctx.db
      .query('runs')
      .withIndex('by_uid', (q) => q.eq('uid', args.uid))
      .collect();

    const progressions = new Map();

    for (const run of runs) {
      const current = progressions.get(run.country) || { countryId: run.country, xp: 0, level: 1, runs: 0 };
      current.runs += 1;
      current.xp += Math.max(25, Math.round(run.netWPM * 8));
      current.level = Math.floor(current.xp / 500) + 1;
      progressions.set(run.country, current);
    }

    return { progressions: Array.from(progressions.values()) };
  },
});
