import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// שתי תזכורות תרגול ביום — בוקר (09:00) וערב (17:00) שעון ישראל.
// שעון ישראל בחורף = UTC+2, לכן 07:00/15:00 UTC. (לא מתחשב בשעון קיץ —
// כמו שהיה קודם; במעבר לקיץ ההתראות יגיעו שעה מוקדם יותר בפועל)
crons.cron(
  'morning practice reminder',
  '0 7 * * *',
  internal.notifications.sendPracticeReminders,
  { slot: 'morning' }
);

crons.cron(
  'evening practice reminder',
  '0 15 * * *',
  internal.notifications.sendPracticeReminders,
  { slot: 'evening' }
);

export default crons;
