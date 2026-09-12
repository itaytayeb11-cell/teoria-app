import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUserId } from './model';

// שליפת המשתמש הנוכחי המחובר
// מחזיר null אם המשתמש לא מחובר
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // חיפוש המשתמש ב-Database לפי כתובת האימייל מה-Identity
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email ?? ''))
      .unique();

    return user;
  },
});

// עדכון סוג הרישיון שהמשתמש מתרגל אליו (B / A / C1 / C / D / 1)
export const setLicenseType = mutation({
  args: { licenseType: v.string() },
  handler: async (ctx, { licenseType }) => {
    const userId = await requireUserId(ctx);
    await ctx.db.patch(userId, { licenseType, updatedAt: Date.now() });
    return userId;
  },
});

// עדכון פרטי הפרופיל של המשתמש המחובר בלבד — לא מקבל userId מהלקוח בכלל,
// כדי שלא יהיה אפשרי (בטעות או בזדון) לערוך פרופיל של מישהו אחר
export const updateMyProfile = mutation({
  args: { fullName: v.string() },
  handler: async (ctx, { fullName }) => {
    const userId = await requireUserId(ctx);
    const trimmed = fullName.trim();
    await ctx.db.patch(userId, {
      fullName: trimmed || undefined,
      updatedAt: Date.now(),
    });
    return userId;
  },
});

// קביעת תאריך מבחן התאוריה המתוכנן — לספירה לאחור בדף הבית.
// null מוחק תאריך שכבר נקבע (למשל אם המבחן נדחה)
export const setTestDate = mutation({
  args: { testDate: v.union(v.number(), v.null()) },
  handler: async (ctx, { testDate }) => {
    const userId = await requireUserId(ctx);
    await ctx.db.patch(userId, {
      testDate: testDate ?? undefined,
      updatedAt: Date.now(),
    });
    return userId;
  },
});

// מחיקת חשבון המשתמש הנוכחי וכל הנתונים המשויכים אליו
// ⚠️ אזהרה: פעולה זו בלתי הפיכה ותמחק את כל הנתונים לצמיתות!
export const deleteMyAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    let deletedCount = 0;

    // מחיקת כל המבחנים של המשתמש
    const sessions = await ctx.db
      .query('quizSessions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    for (const s of sessions) {
      await ctx.db.delete(s._id);
      deletedCount += 1;
    }

    // מחיקת יומן התשובות
    const logs = await ctx.db
      .query('answerLog')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    for (const l of logs) {
      await ctx.db.delete(l._id);
      deletedCount += 1;
    }

    // מחיקת רשומות רכישה
    const purchases = await ctx.db
      .query('purchases')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    for (const p of purchases) {
      await ctx.db.delete(p._id);
      deletedCount += 1;
    }

    // מחיקת רשומת המשתמש עצמה
    const user = await ctx.db.get(userId);
    if (user) {
      await ctx.db.delete(userId);
      deletedCount += 1;
    }

    return {
      success: true,
      message: `נמחקו ${deletedCount} רשומות עבור משתמש ${userId}`,
      deletedCount,
    };
  },
});
