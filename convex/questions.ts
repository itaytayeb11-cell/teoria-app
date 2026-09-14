import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import { internalMutation, type QueryCtx, query } from './_generated/server';
import { filterByLicense, getUserIdOrNull } from './model';

// שולף את סוג הרישיון של המשתמש המחובר (או undefined)
async function currentLicenseType(ctx: QueryCtx): Promise<string | undefined> {
  const userId = await getUserIdOrNull(ctx);
  if (!userId) {
    return undefined;
  }
  const user = await ctx.db.get(userId);
  return user?.licenseType ?? undefined;
}

// ==========================================================================
// שליפת שאלות מהמאגר
// ==========================================================================

// רשימת כל הנושאים + כמות שאלות בכל נושא
export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const licenseType = await currentLicenseType(ctx);
    const all = await ctx.db
      .query('questions')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect();
    const questions = filterByLicense(all, licenseType);

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
    filtered = filterByLicense(filtered, await currentLicenseType(ctx));

    return limit ? filtered.slice(0, limit) : filtered;
  },
});

// מילון תמרורים — שאלות עם תמונה, מקובצות לפי תת-נושא, בלי כפילות תמונה
export const signDictionary = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query('questions')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect();

    const seenUrls = new Set<string>();
    const groups = new Map<
      string,
      {
        id: string;
        url: string;
        text: string;
        answer: string; // התשובה הנכונה לשאלה — משמשת כ"פירוש" התמרור בפועל
        category: string;
        officialId?: string;
      }[]
    >();

    for (const q of all) {
      if (!q.imageUrl || seenUrls.has(q.imageUrl)) {
        continue;
      }
      seenUrls.add(q.imageUrl);
      const group = q.subCategory ?? q.category;
      const list = groups.get(group) ?? [];
      list.push({
        id: q._id,
        url: q.imageUrl,
        text: q.text,
        answer: q.answers[q.correctAnswer] ?? '',
        category: q.category,
        officialId: q.officialId,
      });
      groups.set(group, list);
    }

    return [...groups.entries()]
      .map(([group, items]) => ({ group, items }))
      .sort((a, b) => b.items.length - a.items.length);
  },
});

// התקדמות במילון תמרורים — כמה תמונות שונות המשתמש כבר ראה בפועל בתרגול/מבחן
export const signProgress = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserIdOrNull(ctx);

    const all = await ctx.db
      .query('questions')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect();
    const withImage = new Map<string, string>(); // questionId -> imageUrl
    const uniqueUrls = new Set<string>();
    for (const q of all) {
      if (q.imageUrl) {
        withImage.set(q._id, q.imageUrl);
        uniqueUrls.add(q.imageUrl);
      }
    }

    if (!userId) {
      return { seen: 0, total: uniqueUrls.size };
    }

    const logs = await ctx.db
      .query('answerLog')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    const seenUrls = new Set<string>();
    for (const log of logs) {
      const url = withImage.get(log.questionId);
      if (url) {
        seenUrls.add(url);
      }
    }

    return { seen: seenUrls.size, total: uniqueUrls.size };
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
  subCategory: v.optional(v.string()),
  difficulty: v.number(),
  imageUrl: v.optional(v.string()),
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
