import { getAuthUserId } from '@convex-dev/auth/server';
import type { Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';

// פונקציות עזר משותפות ל-Backend (לא נרשמות כ-Convex functions)

// מחזיר את מזהה המשתמש המחובר, או זורק שגיאה אם לא מחובר
export async function requireUserId(
  ctx: QueryCtx | MutationCtx
): Promise<Id<'users'>> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error('לא מחובר למערכת');
  }
  return userId as Id<'users'>;
}

// מחזיר את מזהה המשתמש המחובר, או null אם לא מחובר
export async function getUserIdOrNull(
  ctx: QueryCtx | MutationCtx
): Promise<Id<'users'> | null> {
  const userId = await getAuthUserId(ctx);
  return (userId as Id<'users'> | null) ?? null;
}

// בודק אם למשתמש יש גישה בתשלום פעילה
export async function userHasPremium(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>
): Promise<boolean> {
  const purchase = await ctx.db
    .query('purchases')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .filter((q) => q.eq(q.field('isActive'), true))
    .first();
  return purchase !== null;
}

// מסנן שאלות לפי סוג רישיון.
// שאלה נכללת אם היא מסומנת לסוג הרישיון, או אם אין לה סימון רישיון כלל (שאלה כללית).
export function filterByLicense<T extends { licenseTypes?: string[] }>(
  questions: T[],
  licenseType: string | undefined
): T[] {
  if (!licenseType) {
    return questions;
  }
  return questions.filter(
    (q) =>
      !q.licenseTypes ||
      q.licenseTypes.length === 0 ||
      q.licenseTypes.includes(licenseType)
  );
}

// ערבוב מערך (Fisher-Yates) — מחזיר מערך חדש
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// תאריך היום לפי שעון ישראל בפורמט YYYY-MM-DD
export function israelDay(ts = Date.now()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toISOString().slice(0, 10);
  }
}

function dayBefore(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// מעדכן את רצף ימי התרגול של המשתמש (נקרא בכל פעילות)
export async function touchStreak(
  ctx: MutationCtx,
  userId: Id<'users'>
): Promise<void> {
  const user = await ctx.db.get(userId);
  if (!user) {
    return;
  }
  const today = israelDay();
  if (user.lastActiveDay === today) {
    return;
  }
  const continues = user.lastActiveDay === dayBefore(today);
  await ctx.db.patch(userId, {
    lastActiveDay: today,
    streakDays: continues ? (user.streakDays ?? 0) + 1 : 1,
    updatedAt: Date.now(),
  });
}

// מפה של questionId -> התשובה האחרונה (isCorrect) של המשתמש
export function latestAnswerByQuestion(
  logs: {
    questionId: Id<'questions'>;
    isCorrect: boolean;
    answeredAt: number;
  }[]
): Map<Id<'questions'>, boolean> {
  const latest = new Map<Id<'questions'>, { at: number; correct: boolean }>();
  for (const l of logs) {
    const prev = latest.get(l.questionId);
    if (!prev || l.answeredAt > prev.at) {
      latest.set(l.questionId, { at: l.answeredAt, correct: l.isCorrect });
    }
  }
  return new Map([...latest].map(([k, v]) => [k, v.correct]));
}

// כמו למעלה, אך שומר גם את התשובה שנבחרה (לתצוגת "התשובה שלך" במחסן הטעויות)
export function latestAnswerRecordByQuestion(
  logs: {
    questionId: Id<'questions'>;
    isCorrect: boolean;
    selected?: number;
    answeredAt: number;
  }[]
): Map<Id<'questions'>, { isCorrect: boolean; selected?: number }> {
  const latest = new Map<
    Id<'questions'>,
    { at: number; isCorrect: boolean; selected?: number }
  >();
  for (const l of logs) {
    const prev = latest.get(l.questionId);
    if (!prev || l.answeredAt > prev.at) {
      latest.set(l.questionId, {
        at: l.answeredAt,
        isCorrect: l.isCorrect,
        selected: l.selected,
      });
    }
  }
  return new Map(
    [...latest].map(([k, v]) => [
      k,
      { isCorrect: v.isCorrect, selected: v.selected },
    ])
  );
}
