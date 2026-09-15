import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalMutation, type QueryCtx, query } from './_generated/server';
import { filterByLicense, getUserIdOrNull } from './model';

// כל סוגי הרישיון האפשריים בפועל (ר' הערה ב-convex/schema.ts users.licenseType)
const LICENSE_TYPES = ['B', 'A', 'C1', 'C', 'D', '1'] as const;
const ALL_LICENSE_KEY = 'all';

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

// רשימת כל הנושאים + כמות שאלות בכל נושא — מהקאש (questionBankStats),
// לא סריקה מלאה של מאגר השאלות. ר' הערה ב-schema.ts.
export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const licenseType = await currentLicenseType(ctx);
    const stats = await getBankStats(ctx, licenseType);
    return stats.categories;
  },
});

// שולף מהקאש את סטטיסטיקות המאגר לסוג רישיון נתון (עם fallback ל"all"
// אם עדיין לא רץ recomputeBankStats עבור סוג רישיון ספציפי זה)
export async function getBankStats(
  ctx: QueryCtx,
  licenseType: string | undefined
): Promise<{
  bankSize: number;
  categories: { category: string; count: number }[];
}> {
  const key = licenseType ?? ALL_LICENSE_KEY;
  const cached = await ctx.db
    .query('questionBankStats')
    .withIndex('by_licenseKey', (q) => q.eq('licenseKey', key))
    .unique();
  if (cached) {
    return { bankSize: cached.bankSize, categories: cached.categories };
  }
  const fallback = await ctx.db
    .query('questionBankStats')
    .withIndex('by_licenseKey', (q) => q.eq('licenseKey', ALL_LICENSE_KEY))
    .unique();
  return fallback
    ? { bankSize: fallback.bankSize, categories: fallback.categories }
    : { bankSize: 0, categories: [] };
}

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

    // מחשב מחדש את קאש הסטטיסטיקות אוטומטית בסוף הייבוא — כדי שאף אחד
    // לא יצטרך לזכור להריץ את זה ידנית (וגם בלי cron מיותר שרץ סתם כל
    // הזמן על מאגר שכמעט אף פעם לא משתנה)
    if (inserted > 0) {
      await ctx.scheduler.runAfter(
        0,
        internal.questions.recomputeBankStats,
        {}
      );
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

// ==========================================================================
// מחשב מחדש את קאש הסטטיסטיקות (questionBankStats) לכל סוגי הרישיון.
// רץ אוטומטית בסוף importQuestions — אין צורך להריץ ידנית אחרי ייבוא רגיל.
// להרצה ידנית (למשל אחרי clearAll, או אם צריך רענון יזום):
//   bunx convex run questions:recomputeBankStats
// ==========================================================================
export const recomputeBankStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const active = await ctx.db
      .query('questions')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect();

    const keys: string[] = [ALL_LICENSE_KEY, ...LICENSE_TYPES];
    for (const key of keys) {
      const filtered =
        key === ALL_LICENSE_KEY ? active : filterByLicense(active, key);
      const counts = new Map<string, number>();
      for (const q of filtered) {
        counts.set(q.category, (counts.get(q.category) ?? 0) + 1);
      }
      const categories = [...counts.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      const existing = await ctx.db
        .query('questionBankStats')
        .withIndex('by_licenseKey', (q) => q.eq('licenseKey', key))
        .unique();
      const doc = {
        licenseKey: key,
        bankSize: filtered.length,
        categories,
        updatedAt: Date.now(),
      };
      if (existing) {
        await ctx.db.patch(existing._id, doc);
      } else {
        await ctx.db.insert('questionBankStats', doc);
      }
    }

    return { licenseKeys: keys, totalActive: active.length };
  },
});
