import { query } from './_generated/server';
import { requireUserId } from './model';

const RECENT_WINDOW = 5; // כמה מבחנים אחרונים לחישוב ממוצע

// ==========================================================================
// לוח מחוונים אישי
// ==========================================================================
export const getMyStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    const completed = await ctx.db
      .query('quizSessions')
      .withIndex('by_user_status', (q) =>
        q.eq('userId', userId).eq('status', 'completed')
      )
      .order('desc')
      .collect();

    const recent = completed.slice(0, RECENT_WINDOW);
    const averageScore =
      recent.length > 0
        ? Math.round(
            recent.reduce((sum, s) => sum + s.scorePercent, 0) / recent.length
          )
        : 0;

    const allAnswers = await ctx.db
      .query('answerLog')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    // חישוב אחוז הצלחה לכל נושא -> הנושא החלש ביותר
    const perCategory = new Map<string, { correct: number; total: number }>();
    for (const a of allAnswers) {
      const entry = perCategory.get(a.category) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (a.isCorrect) {
        entry.correct += 1;
      }
      perCategory.set(a.category, entry);
    }

    const categoryBreakdown = [...perCategory.entries()]
      .map(([category, { correct, total }]) => ({
        category,
        total,
        correct,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    // חישוב אחוז הצלחה לכל תת-נושא
    const perSub = new Map<
      string,
      { category: string; correct: number; total: number }
    >();
    for (const a of allAnswers) {
      const sub = a.subCategory ?? a.category;
      const entry = perSub.get(sub) ?? {
        category: a.category,
        correct: 0,
        total: 0,
      };
      entry.total += 1;
      if (a.isCorrect) {
        entry.correct += 1;
      }
      perSub.set(sub, entry);
    }

    const subCategoryBreakdown = [...perSub.entries()]
      .map(([subCategory, { category, correct, total }]) => ({
        subCategory,
        category,
        total,
        correct,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    // נושא חלש: הכי נמוך באחוזים מבין נושאים עם לפחות 3 תשובות
    const weakCategory =
      categoryBreakdown.find((c) => c.total >= 3) ??
      categoryBreakdown[0] ??
      null;
    const weakSubCategories = subCategoryBreakdown
      .filter((s) => s.total >= 3)
      .slice(0, 3);

    // מגמת ציונים — מהישן לחדש, עד 12 מבחנים אחרונים
    const scoreTrend = [...completed]
      .slice(0, 12)
      .reverse()
      .map((s) => ({
        score: s.scorePercent,
        date: s.completedAt ?? s.startedAt,
      }));

    // האם משתפרים? השוואת ממוצע 3 ראשונים מול 3 אחרונים
    let trendDirection: 'up' | 'down' | 'flat' | null = null;
    if (scoreTrend.length >= 4) {
      const firstAvg =
        scoreTrend.slice(0, 3).reduce((s, x) => s + x.score, 0) / 3;
      const lastAvg = scoreTrend.slice(-3).reduce((s, x) => s + x.score, 0) / 3;
      const diff = lastAvg - firstAvg;
      trendDirection = diff > 3 ? 'up' : diff < -3 ? 'down' : 'flat';
    }

    return {
      totalQuizzes: completed.length,
      totalAnswered: allAnswers.length,
      totalCorrect: allAnswers.filter((a) => a.isCorrect).length,
      averageScore,
      lastScore: completed[0]?.scorePercent ?? null,
      weakCategory: weakCategory?.category ?? null,
      weakCategoryAccuracy: weakCategory?.accuracy ?? null,
      categoryBreakdown,
      subCategoryBreakdown,
      weakSubCategories,
      scoreTrend,
      trendDirection,
    };
  },
});

// היסטוריית מבחנים
export const getHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const sessions = await ctx.db
      .query('quizSessions')
      .withIndex('by_user_status', (q) =>
        q.eq('userId', userId).eq('status', 'completed')
      )
      .order('desc')
      .take(50);

    return sessions.map((s) => ({
      _id: s._id,
      mode: s.mode,
      filterValue: s.filterValue,
      scorePercent: s.scorePercent,
      correctCount: s.correctCount,
      totalQuestions: s.totalQuestions,
      completedAt: s.completedAt,
    }));
  },
});
