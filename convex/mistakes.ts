import type { Id } from './_generated/dataModel';
import { type QueryCtx, query } from './_generated/server';
import { latestAnswerByQuestion, requireUserId } from './model';

// שאלות שבהן התשובה האחרונה של המשתמש הייתה שגויה — "מחסן הטעויות"
async function mistakeQuestionIds(ctx: QueryCtx, userId: Id<'users'>) {
  const logs = await ctx.db
    .query('answerLog')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect();
  const latest = latestAnswerByQuestion(logs);
  return [...latest.entries()]
    .filter(([, correct]) => !correct)
    .map(([qId]) => qId);
}

export const count = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const ids = await mistakeQuestionIds(ctx, userId);
    return ids.length;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const ids = await mistakeQuestionIds(ctx, userId);
    const questions = [];
    for (const id of ids) {
      const q = await ctx.db.get(id);
      if (q) {
        questions.push(q);
      }
    }
    return questions;
  },
});
