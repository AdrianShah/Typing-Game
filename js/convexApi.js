import { makeFunctionReference } from 'convex/server';

export const api = {
  users: {
    upsertClerkProfile: makeFunctionReference('users:upsertClerkProfile'),
    updateProfileBasics: makeFunctionReference('users:updateProfileBasics'),
    getProfileByUid: makeFunctionReference('users:getProfileByUid'),
    getProfileByEmail: makeFunctionReference('users:getProfileByEmail'),
  },
  leaderboard: {
    createRunSession: makeFunctionReference('leaderboard:createRunSession'),
    submitRun: makeFunctionReference('leaderboard:submitRun'),
    getTopRuns: makeFunctionReference('leaderboard:getTopRuns'),
    fetchCountryProgression: makeFunctionReference('leaderboard:fetchCountryProgression'),
  },
  multiplayer: {
    createMultiplayerRoom: makeFunctionReference('multiplayer:createMultiplayerRoom'),
    getRoomByCode: makeFunctionReference('multiplayer:getRoomByCode'),
    getRoomDetails: makeFunctionReference('multiplayer:getRoomDetails'),
    joinRoomByCode: makeFunctionReference('multiplayer:joinRoomByCode'),
    leaveRoom: makeFunctionReference('multiplayer:leaveRoom'),
    setReadyStatus: makeFunctionReference('multiplayer:setReadyStatus'),
    updateRoomConfig: makeFunctionReference('multiplayer:updateRoomConfig'),
    kickParticipant: makeFunctionReference('multiplayer:kickParticipant'),
    closeRoom: makeFunctionReference('multiplayer:closeRoom'),
    updateHeartbeat: makeFunctionReference('multiplayer:updateHeartbeat'),
  },
  multiplayerMatch: {
    startRound: makeFunctionReference('multiplayerMatch:startRound'),
    submitRoundAttempt: makeFunctionReference('multiplayerMatch:submitRoundAttempt'),
    restartMatchState: makeFunctionReference('multiplayerMatch:restartMatchState'),
  },
};
