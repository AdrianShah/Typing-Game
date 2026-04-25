import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.weekly(
  'atlas-weekly-campaign-rotation',
  { dayOfWeek: 'sunday', hourUTC: 0, minuteUTC: 5 },
  internal.leaderboard.runWeeklyCampaignRotation,
);

export default crons;
