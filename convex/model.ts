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

// ערבוב מערך (Fisher-Yates) — מחזיר מערך חדש
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
