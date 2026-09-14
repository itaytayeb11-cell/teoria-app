import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { internalMutation, query } from './_generated/server';
import { requireUserId, userHasPremium } from './model';

// ==========================================================================
// בדיקת גישה בתשלום
// ==========================================================================
export const getMyAccess = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const hasPremium = await userHasPremium(ctx, userId);
    return { hasPremium };
  },
});

// אירועי RevenueCat שמעניקים גישה (רכישה פעילה)
const GRANT_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'NON_RENEWING_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'SUBSCRIPTION_EXTENDED',
  'REFUND_REVERSED',
]);
// אירועים ששוללים גישה (בוטלה/הוחזר כסף/נכשל חיוב/פג תוקף)
const REVOKE_EVENTS = new Set(['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE']);

// ==========================================================================
// מקור האמת היחיד לרכישות — נקרא רק מה-webhook המאומת ב-convex/http.ts,
// לעולם לא ישירות מהאפליקציה. ה-appUserId חייב להיות בדיוק ה-userId שלנו
// ב-Convex (ר' RevenueCatContext.tsx שמגדיר את זה כ-appUserID מול RevenueCat),
// אחרת אין לנו דרך לדעת איזה משתמש שלנו ביצע את הרכישה.
// ==========================================================================
export const applyWebhookEvent = internalMutation({
  args: {
    appUserId: v.string(),
    eventType: v.string(),
    productId: v.string(),
    store: v.optional(v.string()),
  },
  handler: async (ctx, { appUserId, eventType, productId, store }) => {
    const isActive = GRANT_EVENTS.has(eventType)
      ? true
      : REVOKE_EVENTS.has(eventType)
        ? false
        : null;
    if (isActive === null) {
      return; // אירוע שלא משפיע על גישה (למשל TRANSFER) — מתעלמים
    }

    // app_user_id יכול להיות ID אנונימי של RevenueCat (אם המשתמש רכש לפני
    // שה-SDK הצליח להתחבר לזהות שלנו) ולא בהכרח מזהה Convex תקין — ctx.db.get
    // עם מחרוזת שלא תואמת כלל את הפורמט עלול לזרוק, לא רק להחזיר null
    let user: Doc<'users'> | null = null;
    try {
      user = await ctx.db.get(appUserId as Id<'users'>);
    } catch {
      user = null;
    }
    if (!user) {
      return; // app_user_id לא תואם משתמש קיים אצלנו — כלום לעדכן
    }
    const userId = user._id;

    const now = Date.now();
    const existing = await ctx.db
      .query('purchases')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        productId,
        entitlement: 'premium',
        platform: store,
        isActive,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('purchases', {
        userId,
        productId,
        entitlement: 'premium',
        platform: store,
        isActive,
        purchasedAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(userId, {
      userType: isActive ? 'paid' : 'free',
      updatedAt: now,
    });
  },
});
