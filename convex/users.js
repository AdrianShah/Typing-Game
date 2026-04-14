import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server';
import { v } from 'convex/values';

export const upsertClerkProfile = mutation({
  args: {
    uid: v.string(),
    player: v.string(),
    icon: v.string(),
    country: v.optional(v.string()),
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    profileComplete: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_uid', (q) => q.eq('uid', args.uid))
      .unique();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        player: args.player,
        icon: args.icon,
        country: args.country,
        email: args.email,
        authProvider: 'clerk',
        username: args.username,
        imageUrl: args.imageUrl,
        profileComplete: args.profileComplete,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert('users', {
      uid: args.uid,
      player: args.player,
      icon: args.icon,
      country: args.country,
      email: args.email,
      authProvider: 'clerk',
      username: args.username,
      imageUrl: args.imageUrl,
      profileComplete: args.profileComplete,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProfileBasics = mutation({
  args: {
    uid: v.string(),
    player: v.string(),
    icon: v.string(),
    country: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    profileComplete: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_uid', (q) => q.eq('uid', args.uid))
      .unique();

    if (!existing) {
      throw new Error('User profile not found.');
    }

    const now = Date.now();
    const updates = {
      icon: args.icon,
      profileComplete: args.profileComplete,
      updatedAt: now,
    };

    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const ONE_DAY = 24 * 60 * 60 * 1000;

    // Username, avatar, and country changes are rate-limited so the public profile stays
    // stable and the client cannot churn identity metadata on every save.
    if (args.player !== existing.player) {
      if (existing.lastUsernameChange && now - existing.lastUsernameChange < THIRTY_DAYS) {
        throw new Error('Username can only be changed once every 30 days.');
      }
      updates.player = args.player;
      updates.lastUsernameChange = now;
    }

    if (args.country !== existing.country && args.country !== undefined) {
      if (existing.lastCountryChange && now - existing.lastCountryChange < ONE_DAY) {
        throw new Error('Country can only be changed once a day.');
      }
      updates.country = args.country;
      updates.lastCountryChange = now;
    } else {
      updates.country = args.country;
    }

    if (args.imageUrl !== undefined && args.imageUrl !== existing.imageUrl) {
      if (existing.lastAvatarChange && now - existing.lastAvatarChange < ONE_DAY) {
        throw new Error('Avatar can only be changed once a day.');
      }
      updates.imageUrl = args.imageUrl;
      updates.lastAvatarChange = now;
    }

    await ctx.db.patch(existing._id, updates);

    return existing._id;
  },
});

export const getProfileByUid = query({
  args: {
    uid: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_uid', (q) => q.eq('uid', args.uid))
      .unique();
  },
});

export const getProfileByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique();
  },
});
