import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUserId } from './model';

// החלפת מצב שמירה לשאלה (מוסיף / מסיר bookmark)
export const toggle = mutation({
  args: { questionId: v.id('questions') },
  handler: async (ctx, { questionId }) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query('savedQuestions')
      .withIndex('by_user_question', (q) =>
        q.eq('userId', userId).eq('questionId', questionId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { saved: false };
    }
    await ctx.db.insert('savedQuestions', {
      userId,
      questionId,
      createdAt: Date.now(),
    });
    return { saved: true };
  },
});

// רשימת מזהי השאלות השמורות (לסימון מהיר במסכים)
export const listIds = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query('savedQuestions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    return rows.map((r) => r.questionId);
  },
});

// השאלות השמורות במלואן
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query('savedQuestions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect();

    const docs = await Promise.all(
      rows.map((row) => ctx.db.get(row.questionId))
    );
    return docs.filter((q) => q !== null);
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query('savedQuestions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    return rows.length;
  },
});
