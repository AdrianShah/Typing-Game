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

  multiplayerRooms: defineTable({
    hostUid: v.string(),
    roomCode: v.string(),
    mode: v.number(),
    difficulty: v.string(),
    matchType: v.string(), // "regular" | "penalty"
    status: v.string(), // "waiting" | "active" | "finished"
    maxParticipants: v.number(),
    roomConfigVersion: v.number(),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    activeRoundId: v.optional(v.id("rounds")),
  })
    .index("by_roomCode", ["roomCode"])
    .index("by_hostUid", ["hostUid"]),

  roomParticipants: defineTable({
    roomId: v.id("multiplayerRooms"),
    uid: v.optional(v.string()),
    guestId: v.optional(v.string()),
    player: v.string(),
    icon: v.string(),
    country: v.optional(v.string()),
    ready: v.boolean(),
    joinedAt: v.number(),
    lastSeenAt: v.number(),
  })
    .index("by_roomId", ["roomId"])
    .index("by_uid", ["uid"])
    .index("by_guestId", ["guestId"]),

  rounds: defineTable({
    roomId: v.id("multiplayerRooms"),
    roundNumber: v.number(),
    status: v.string(), // "pending" | "active" | "finished"
    wordListText: v.string(), // Explicit round text payload
    startedAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_roomId", ["roomId"]),

  roundAttempts: defineTable({
    roundId: v.id("rounds"),
    participantId: v.id("roomParticipants"),
    grossWPM: v.number(),
    netWPM: v.number(),
    accuracy: v.number(),
    errors: v.number(),
    correctWords: v.number(),
    completedAt: v.number(),
  })
    .index("by_roundId", ["roundId"])
    .index("by_participantId", ["participantId"])
    .index("by_roundId_participantId", ["roundId", "participantId"]),

  roundResults: defineTable({
    roundId: v.id("rounds"),
    standings: v.array(
      v.object({
        participantId: v.id("roomParticipants"),
        player: v.string(),
        position: v.number(),
        grossWPM: v.number(),
        netWPM: v.number(),
        accuracy: v.number(),
        correctWords: v.number(),
        rankingScore: v.number(), // Score used for placement
        dnf: v.optional(v.boolean()),
      })
    ),
    completedAt: v.number(),
  }).index("by_roundId", ["roundId"]),
});
