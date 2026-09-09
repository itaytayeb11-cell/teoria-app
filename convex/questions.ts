import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import { internalMutation, query } from './_generated/server';

// ==========================================================================
// שליפת שאלות מהמאגר
// ==========================================================================

// רשימת כל הנושאים + כמות שאלות בכל נושא
export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db
      .query('questions')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect();

    const counts = new Map<string, number>();
    for (const q of questions) {
      counts.set(q.category, (counts.get(q.category) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  },
});

// שליפת שאלות פעילות, עם סינון אופציונלי לפי נושא / דרגת קושי
export const getQuestions = query({
  args: {
    category: v.optional(v.string()),
    difficulty: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { category, difficulty, limit }) => {
    let results: Doc<'questions'>[];

    if (category !== undefined) {
      results = await ctx.db
        .query('questions')
        .withIndex('by_category', (q) => q.eq('category', category))
        .collect();
    } else if (difficulty !== undefined) {
      results = await ctx.db
        .query('questions')
        .withIndex('by_difficulty', (q) => q.eq('difficulty', difficulty))
        .collect();
    } else {
      results = await ctx.db
        .query('questions')
        .withIndex('by_active', (q) => q.eq('isActive', true))
        .collect();
    }

    let filtered = results.filter((q) => q.isActive);
    if (category !== undefined && difficulty !== undefined) {
      filtered = filtered.filter((q) => q.difficulty === difficulty);
    }

    return limit ? filtered.slice(0, limit) : filtered;
  },
});

// שליפת שאלה בודדת לפי מזהה
export const getById = query({
  args: { questionId: v.id('questions') },
  handler: async (ctx, { questionId }) => {
    return await ctx.db.get(questionId);
  },
});

// כמות השאלות הכוללת במאגר
export const count = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('questions').collect();
    return {
      total: all.length,
      active: all.filter((q) => q.isActive).length,
    };
  },
});

// ==========================================================================
// טביעת שאלות (seed) — נקרא רק מסקריפט, לא מהאפליקציה
// ==========================================================================

const questionInput = v.object({
  text: v.string(),
  answers: v.array(v.string()),
  correctAnswer: v.number(),
  explanation: v.optional(v.string()),
  category: v.string(),
  difficulty: v.number(),
  licenseTypes: v.optional(v.array(v.string())),
  officialId: v.optional(v.string()),
});

// מייבא אצווה של שאלות. מדלג על שאלות שכבר קיימות (לפי officialId).
export const importQuestions = internalMutation({
  args: { items: v.array(questionInput) },
  handler: async (ctx, { items }) => {
    let inserted = 0;
    let skipped = 0;

    for (const item of items) {
      if (item.officialId) {
        const existing = await ctx.db
          .query('questions')
          .withIndex('by_officialId', (q) =>
            q.eq('officialId', item.officialId)
          )
          .first();
        if (existing) {
          skipped += 1;
          continue;
        }
      }

      await ctx.db.insert('questions', {
        ...item,
        isActive: true,
      });
      inserted += 1;
    }

    return { inserted, skipped };
  },
});

// מוחק את כל השאלות (לשימוש בפיתוח בלבד, לפני טעינה מחדש)
export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('questions').collect();
    for (const q of all) {
      await ctx.db.delete(q._id);
    }
    return { deleted: all.length };
  },
});
