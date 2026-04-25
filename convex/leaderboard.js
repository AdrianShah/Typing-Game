import {
  mutationGeneric as mutation,
  queryGeneric as query,
  internalMutationGeneric as internalMutation,
} from 'convex/server';
import { v } from 'convex/values';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_MILESTONE_TARGET = 50000;
const COUNTRY_TO_CONTINENT = {
  Canada: 'CONCACAF',
  Mexico: 'CONCACAF',
  'United States': 'CONCACAF',
  Panama: 'CONCACAF',
  'Curaçao': 'CONCACAF',
  Haiti: 'CONCACAF',
  England: 'UEFA',
  France: 'UEFA',
  Croatia: 'UEFA',
  Portugal: 'UEFA',
  Norway: 'UEFA',
  Germany: 'UEFA',
  Netherlands: 'UEFA',
  Switzerland: 'UEFA',
  Scotland: 'UEFA',
  Spain: 'UEFA',
  Austria: 'UEFA',
  Belgium: 'UEFA',
  'Bosnia and Herzegovina': 'UEFA',
  Sweden: 'UEFA',
  Turkey: 'UEFA',
  'Czech Republic': 'UEFA',
  Argentina: 'CONMEBOL',
  Ecuador: 'CONMEBOL',
  Colombia: 'CONMEBOL',
  Uruguay: 'CONMEBOL',
  Brazil: 'CONMEBOL',
  Paraguay: 'CONMEBOL',
  Egypt: 'CAF',
  Senegal: 'CAF',
  'South Africa': 'CAF',
  'Cape Verde': 'CAF',
  Morocco: 'CAF',
  'Ivory Coast': 'CAF',
  Algeria: 'CAF',
  Ghana: 'CAF',
  Tunisia: 'CAF',
  'DR Congo': 'CAF',
  Iran: 'AFC',
  Japan: 'AFC',
  'South Korea': 'AFC',
  Uzbekistan: 'AFC',
  Jordan: 'AFC',
  Qatar: 'AFC',
  'Saudi Arabia': 'AFC',
  Australia: 'AFC',
  Iraq: 'AFC',
  'New Zealand': 'OFC',
};

function getWeekWindow(timestamp) {
  const current = Number.isFinite(timestamp) ? timestamp : Date.now();
  const mondayOffset = 4 * 24 * 60 * 60 * 1000;
  const weekStart = Math.floor((current - mondayOffset) / WEEK_MS) * WEEK_MS + mondayOffset;
  const weekEnd = weekStart + WEEK_MS;
  return {
    weekStart,
    weekEnd,
    weekKey: new Date(weekStart).toISOString().slice(0, 10),
  };
}

function getContinentRegion(country) {
  return COUNTRY_TO_CONTINENT[country] || 'GLOBAL';
}

async function upsertFactionWeeklyTotals(ctx, country, earnedXP, runTimestamp) {
  const { weekKey } = getWeekWindow(runTimestamp);
  const existingFaction = await ctx.db
    .query('factions')
    .withIndex('by_country', (q) => q.eq('country', country))
    .first();

  if (!existingFaction) {
    await ctx.db.insert('factions', {
      country,
      weekKey,
      weeklyXP: earnedXP,
      milestoneTarget: DEFAULT_MILESTONE_TARGET,
      milestoneReachedAt: earnedXP >= DEFAULT_MILESTONE_TARGET ? runTimestamp : undefined,
      lifetimeXP: earnedXP,
      totalRuns: 1,
      contributors: 1,
      updatedAt: runTimestamp,
    });
    return;
  }

  const shouldResetWeek = existingFaction.weekKey !== weekKey;
  const nextWeeklyXP = (shouldResetWeek ? 0 : existingFaction.weeklyXP) + earnedXP;
  await ctx.db.patch(existingFaction._id, {
    weekKey,
    weeklyXP: nextWeeklyXP,
    milestoneTarget: existingFaction.milestoneTarget || DEFAULT_MILESTONE_TARGET,
    milestoneReachedAt:
      existingFaction.milestoneReachedAt ||
      (nextWeeklyXP >= (existingFaction.milestoneTarget || DEFAULT_MILESTONE_TARGET) ? runTimestamp : undefined),
    lifetimeXP: (existingFaction.lifetimeXP || 0) + earnedXP,
    totalRuns: (shouldResetWeek ? 0 : existingFaction.totalRuns) + 1,
    updatedAt: runTimestamp,
  });
}

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
    const now = Date.now();
    const { weekKey } = getWeekWindow(now);
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
        consumedAt: now,
      });

      const earnedXP = Math.max(25, Math.round(args.netWPM * 8));
      await upsertFactionWeeklyTotals(ctx, args.country, earnedXP, now);

      return {
        accepted: false,
        personalBest: previousBest.netWPM,
        message: `Run complete! Beat your personal best of ${Math.round(previousBest.netWPM)} to update the leaderboard.`,
      };
    }

    await ctx.db.patch(args.sessionId, {
      consumedAt: now,
    });

    const earnedXP = Math.max(25, Math.round(args.netWPM * 8));
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
      timestamp: now,
      sessionId: args.sessionId,
      xpEarned: earnedXP,
      weekKey,
    });

    await upsertFactionWeeklyTotals(ctx, args.country, earnedXP, now);

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
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query('runs')
      .withIndex('by_mode_difficulty_netWPM', (q) =>
        q.eq('mode', args.mode).eq('difficulty', args.difficulty),
      )
      .order('desc');

    if (args.country) {
      q = q.filter((q) => q.eq(q.field('country'), args.country));
    }
    
    return await q.take(50);
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

export const getFactionStandings = query({
  args: {},
  handler: async (ctx) => {
    const { weekKey } = getWeekWindow(Date.now());
    return await ctx.db
      .query('factions')
      .withIndex('by_weekKey_weeklyXP', (q) => q.eq('weekKey', weekKey))
      .order('desc')
      .take(50);
  },
});

export const getCampaignOverview = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const currentWeek = getWeekWindow(now);
    const previousWeek = getWeekWindow(currentWeek.weekStart - 1);
    const standings = await ctx.db
      .query('factions')
      .withIndex('by_weekKey_weeklyXP', (q) => q.eq('weekKey', currentWeek.weekKey))
      .order('desc')
      .take(64);

    const topCountry = standings[0]?.country || null;
    const completedMilestones = standings.filter(
      (faction) => faction.weeklyXP >= (faction.milestoneTarget || DEFAULT_MILESTONE_TARGET),
    ).length;

    return {
      weekKey: currentWeek.weekKey,
      previousWeekKey: previousWeek.weekKey,
      topCountry,
      completedMilestones,
      standings,
    };
  },
});

export const getChampionsByWeek = query({
  args: {
    weekKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resolvedWeekKey = args.weekKey || getWeekWindow(Date.now() - WEEK_MS).weekKey;
    return await ctx.db
      .query('championsSnapshots')
      .withIndex('by_weekKey', (q) => q.eq('weekKey', resolvedWeekKey))
      .collect();
  },
});

export const getUserCosmetics = query({
  args: {
    uid: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('userCosmetics')
      .withIndex('by_uid', (q) => q.eq('uid', args.uid))
      .collect();
  },
});

export const runWeeklyCampaignRotation = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const currentWeek = getWeekWindow(now);
    const finishedWeek = getWeekWindow(currentWeek.weekStart - 1);
    const weekFactions = await ctx.db
      .query('factions')
      .withIndex('by_weekKey', (q) => q.eq('weekKey', finishedWeek.weekKey))
      .collect();

    if (weekFactions.length === 0) {
      return { ok: true, weekKey: finishedWeek.weekKey, winners: [], awardedUsers: 0, champions: 0 };
    }

    const maxWeeklyXP = Math.max(...weekFactions.map((faction) => faction.weeklyXP));
    const winners = weekFactions.filter((faction) => faction.weeklyXP === maxWeeklyXP);
    const winnerCountries = new Set(winners.map((winner) => winner.country));

    const allRuns = await ctx.db.query('runs').collect();
    const seasonRuns = allRuns.filter((run) => {
      const ts = run.timestamp || 0;
      return ts >= finishedWeek.weekStart && ts < finishedWeek.weekEnd;
    });

    const rewardedUsers = new Set();
    for (const run of seasonRuns) {
      if (!winnerCountries.has(run.country)) continue;
      if (!run.uid || rewardedUsers.has(run.uid)) continue;
      rewardedUsers.add(run.uid);

      const countrySlug = run.country.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const cosmeticId = `country-victory-${countrySlug}-${finishedWeek.weekKey}`;
      const existing = await ctx.db
        .query('userCosmetics')
        .withIndex('by_uid_cosmeticId', (q) => q.eq('uid', run.uid).eq('cosmeticId', cosmeticId))
        .unique();
      if (!existing) {
        await ctx.db.insert('userCosmetics', {
          uid: run.uid,
          cosmeticId,
          type: 'country_badge',
          sourceCountry: run.country,
          seasonWeekKey: finishedWeek.weekKey,
          unlockedAt: now,
          equipped: false,
        });
      }
    }

    const bestByRegionAndUser = new Map();
    for (const run of seasonRuns) {
      const region = getContinentRegion(run.country);
      const key = `${region}::${run.uid}`;
      const currentBest = bestByRegionAndUser.get(key);
      if (!currentBest || run.netWPM > currentBest.netWPM) {
        bestByRegionAndUser.set(key, run);
      }
    }
    const groupedByRegion = new Map();
    for (const run of bestByRegionAndUser.values()) {
      const region = getContinentRegion(run.country);
      const regionList = groupedByRegion.get(region) || [];
      regionList.push(run);
      groupedByRegion.set(region, regionList);
    }

    let championsCount = 0;
    for (const [region, regionRuns] of groupedByRegion.entries()) {
      regionRuns.sort((a, b) => b.netWPM - a.netWPM);
      const topTen = regionRuns.slice(0, 10);
      for (let i = 0; i < topTen.length; i += 1) {
        const run = topTen[i];
        await ctx.db.insert('championsSnapshots', {
          weekKey: finishedWeek.weekKey,
          uid: run.uid,
          player: run.player,
          icon: run.icon,
          country: run.country,
          region,
          netWPM: run.netWPM,
          mode: run.mode,
          difficulty: run.difficulty,
          rank: i + 1,
          createdAt: now,
        });
        championsCount += 1;
      }
    }

    return {
      ok: true,
      weekKey: finishedWeek.weekKey,
      winners: winners.map((winner) => winner.country),
      awardedUsers: rewardedUsers.size,
      champions: championsCount,
    };
  },
});
