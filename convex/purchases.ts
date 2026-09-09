import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
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

// ==========================================================================
// רישום רכישה (נקרא מהאפליקציה אחרי רכישה מוצלחת ב-RevenueCat)
// אימות אמיתי מתבצע גם דרך webhook בצד שרת (convex/http.ts)
// ==========================================================================
export const recordPurchase = mutation({
  args: {
    productId: v.string(),
    entitlement: v.string(),
    platform: v.optional(v.string()),
    revenueCatCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query('purchases')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        isActive: true,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('purchases', {
        userId,
        ...args,
        isActive: true,
        purchasedAt: now,
        updatedAt: now,
      });
    }

    // סימון סוג המשתמש כמשלם
    const user = await ctx.db.get(userId);
    if (user) {
      await ctx.db.patch(userId, { userType: 'paid', updatedAt: now });
    }

    return { success: true };
  },
});
