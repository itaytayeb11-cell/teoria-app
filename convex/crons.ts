import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// תזכורת תרגול יומית — 17:00 שעון ישראל (15:00 UTC)
crons.cron(
  'daily practice reminder',
  '0 15 * * *',
  internal.notifications.sendPracticeReminders,
  {}
);

export default crons;
