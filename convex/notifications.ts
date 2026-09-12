import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import { internalAction, internalQuery, mutation } from './_generated/server';
import { israelDay, requireUserId } from './model';

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// ==========================================================================
// רישום טוקן Push של המכשיר (נקרא מהאפליקציה אחרי אישור הרשאה)
// ==========================================================================
export const registerToken = mutation({
  args: { token: v.string(), platform: v.optional(v.string()) },
  handler: async (ctx, { token, platform }) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query('pushTokens')
      .withIndex('by_token', (q) => q.eq('token', token))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId,
        platform,
        updatedAt: Date.now(),
      });
      return;
    }
    await ctx.db.insert('pushTokens', {
      userId,
      token,
      platform,
      updatedAt: Date.now(),
    });
  },
});

export const unregisterToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await requireUserId(ctx);
    const row = await ctx.db
      .query('pushTokens')
      .withIndex('by_token', (q) => q.eq('token', token))
      .first();
    // מותר למחוק רק טוקן ששייך למשתמש המחובר
    if (row && row.userId === userId) {
      await ctx.db.delete(row._id);
    }
  },
});

// ==========================================================================
// תזכורת תרגול — נשלחת למי שלא תרגל 2 ימים ומעלה (cron יומי)
// ==========================================================================
export const usersNeedingReminder = internalQuery({
  args: {},
  handler: async (ctx) => {
    const tokens = await ctx.db.query('pushTokens').collect();
    const twoDaysAgo = israelDay(Date.now() - 2 * DAY_MS);
    const today = israelDay();

    const targets: { token: string; name: string; streakDays: number }[] = [];
    // מטמון קטן כדי לא לשלוף את אותו משתמש שוב לכל טוקן שלו (יכול להיות
    // רשום עם כמה מכשירים) — אבל כן שולחים לכל הטוקנים שלו, לא רק לראשון
    const userCache = new Map<string, Doc<'users'> | null>();

    for (const t of tokens) {
      let user = userCache.get(t.userId);
      if (user === undefined) {
        user = await ctx.db.get(t.userId);
        userCache.set(t.userId, user);
      }
      if (!user) {
        continue;
      }
      // לא פעיל היום ולא אתמול, ולא נשלחה תזכורת עדיין היום
      const last = user.lastActiveDay ?? '2000-01-01';
      if (
        last < twoDaysAgo ||
        (last !== today && (user.streakDays ?? 0) >= 2)
      ) {
        targets.push({
          token: t.token,
          name: user.fullName || 'תלמיד',
          streakDays: user.streakDays ?? 0,
        });
      }
    }
    return targets;
  },
});

type ReminderTarget = { token: string; name: string; streakDays: number };

export const sendPracticeReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const targets: ReminderTarget[] = await ctx.runQuery(
      internal.notifications.usersNeedingReminder,
      {}
    );
    if (targets.length === 0) {
      return { sent: 0 };
    }

    const messages = targets.map((t) => ({
      to: t.token,
      sound: 'default',
      title: 'זמן לתרגל תאוריה 📚',
      body:
        t.streakDays >= 2
          ? `אל תפספס! הרצף שלך (${t.streakDays} ימים) בסכנה. תרגול קצר שומר עליו.`
          : 'תרגול של 5 דקות היום מקרב אותך למבחן. בוא נמשיך.',
    }));

    // Expo מגביל ל-100 הודעות לבקשה
    for (let i = 0; i < messages.length; i += 100) {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages.slice(i, i + 100)),
      });
    }
    return { sent: messages.length };
  },
});
