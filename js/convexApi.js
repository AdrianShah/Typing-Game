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
};
