import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    uid: v.string(),
    player: v.string(),
    icon: v.string(),
    avatarUrl: v.optional(v.string()),
    country: v.optional(v.string()),
    email: v.optional(v.string()),
    authProvider: v.optional(v.string()),
    discordUsername: v.optional(v.string()),
    username: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    profileComplete: v.boolean(),
    lastUsernameChange: v.optional(v.number()),
    lastAvatarChange: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_uid', ['uid'])
    .index('by_email', ['email']),
  runSessions: defineTable({
    uid: v.string(),
    mode: v.number(),
    difficulty: v.string(),
    createdAt: v.number(),
    consumedAt: v.optional(v.number()),
  }).index('by_uid', ['uid']),
  runs: defineTable({
    uid: v.string(),
    player: v.string(),
    icon: v.string(),
    country: v.string(),
    mode: v.number(),
    difficulty: v.string(),
    netWPM: v.number(),
    grossWPM: v.number(),
    acc: v.number(),
    timestamp: v.number(),
    sessionId: v.id('runSessions'),
  })
    .index('by_uid', ['uid'])
    .index('by_mode_difficulty_netWPM', ['mode', 'difficulty', 'netWPM']),
});
