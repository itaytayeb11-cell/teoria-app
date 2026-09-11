import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { mutation, type QueryCtx, query } from './_generated/server';
import { latestAnswerRecordByQuestion, requireUserId } from './model';

// שאלות שהתשובה האחרונה בהן הייתה שגויה, לא כולל כאלה שסומנו "ידעתי" —
// מחזיר גם כמה פעמים כל שאלה נענתה לא נכון בסך הכל (repeat count) והתשובה האחרונה שנבחרה
async function mistakeEntries(ctx: QueryCtx, userId: Id<'users'>) {
  const logs = await ctx.db
    .query('answerLog')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect();
  const latest = latestAnswerRecordByQuestion(logs);

  const wrongCounts = new Map<Id<'questions'>, number>();
  for (const l of logs) {
    if (!l.isCorrect) {
      wrongCounts.set(l.questionId, (wrongCounts.get(l.questionId) ?? 0) + 1);
    }
  }

  const dismissed = new Set(
    (
      await ctx.db
        .query('mistakeDismissals')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect()
    ).map((d) => d.questionId)
  );

  return [...latest.entries()]
    .filter(([qId, rec]) => !rec.isCorrect && !dismissed.has(qId))
    .map(([questionId, rec]) => ({
      questionId,
      wrongCount: wrongCounts.get(questionId) ?? 1,
      lastSelected: rec.selected,
    }));
}

export const count = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const entries = await mistakeEntries(ctx, userId);
    return entries.length;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const entries = await mistakeEntries(ctx, userId);

    const questions = [];
    for (const e of entries) {
      const q = await ctx.db.get(e.questionId);
      if (q) {
        questions.push({
          ...q,
          wrongCount: e.wrongCount,
          lastSelected: e.lastSelected,
        });
      }
    }
    // הכי חוזרות קודם
    return questions.sort((a, b) => b.wrongCount - a.wrongCount);
  },
});

// מסמן שאלה כ"ידעתי" — יוצאת ממחסן הטעויות עד שתיענה שוב לא נכון
export const dismiss = mutation({
  args: { questionId: v.id('questions') },
  handler: async (ctx, { questionId }) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query('mistakeDismissals')
      .withIndex('by_user_question', (q) =>
        q.eq('userId', userId).eq('questionId', questionId)
      )
      .first();
    if (!existing) {
      await ctx.db.insert('mistakeDismissals', {
        userId,
        questionId,
        dismissedAt: Date.now(),
      });
    }
  },
});

// מסמן את כל השאלות הנוכחיות במחסן כ"ידעתי" בבת אחת
export const dismissAll = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const entries = await mistakeEntries(ctx, userId);
    for (const e of entries) {
      await ctx.db.insert('mistakeDismissals', {
        userId,
        questionId: e.questionId,
        dismissedAt: Date.now(),
      });
    }
    return { dismissed: entries.length };
  },
});
