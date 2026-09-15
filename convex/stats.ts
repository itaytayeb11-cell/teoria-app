import { query } from './_generated/server';
import { israelDay, latestAnswerByQuestion, requireUserId } from './model';
import { getBankStats } from './questions';

const RECENT_WINDOW = 5; // כמה מבחנים אחרונים לחישוב ממוצע
const READINESS_TARGET = 400; // כמה שאלות "מספיק" לכיסוי מלא
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_SIM_MISTAKES = 4; // עד 4 שגיאות = עובר במבחן מדמה — תואם ל-MAX_SIM_MISTAKES ב-app/(authenticated)/results.tsx

// ==========================================================================
// נתוני מסך הבית — ציון מוכנות, רצף, שינוי שבועי, ספירות
// ==========================================================================
export const getHome = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);

    const answers = await ctx.db
      .query('answerLog')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    const completed = await ctx.db
      .query('quizSessions')
      .withIndex('by_user_status', (q) =>
        q.eq('userId', userId).eq('status', 'completed')
      )
      .collect();

    // גודל המאגר הרלוונטי לסוג הרישיון + פילוח נושאים — מהקאש
    // (questionBankStats), לא סריקה מלאה של המאגר. ר' הערה ב-schema.ts:
    // זה מה שגרם בפועל לחריגה ממכסת ה-bandwidth של Convex Free plan.
    const { bankSize, categories } = await getBankStats(
      ctx,
      user?.licenseType ?? undefined
    );

    // כיסוי: כמה שאלות שונות נענו מתוך היעד
    const latest = latestAnswerByQuestion(answers);
    const seen = latest.size;
    const target = Math.max(1, Math.min(bankSize, READINESS_TARGET));
    const coverage = Math.min(1, seen / target);

    // דיוק ב-200 התשובות האחרונות
    const recent = [...answers]
      .sort((a, b) => b.answeredAt - a.answeredAt)
      .slice(0, 200);
    const recentAccuracy =
      recent.length > 0
        ? recent.filter((a) => a.isCorrect).length / recent.length
        : 0;

    const readiness = Math.round(
      100 * (0.45 * coverage + 0.55 * recentAccuracy)
    );
    const readinessLabel =
      readiness >= 80
        ? 'סיכוי מעבר גבוה'
        : readiness >= 60
          ? 'סיכוי מעבר בינוני'
          : 'עוד דרך לעבור';

    // שינוי שבועי בדיוק
    const now = Date.now();
    const thisWeek = answers.filter((a) => a.answeredAt >= now - 7 * DAY_MS);
    const lastWeek = answers.filter(
      (a) =>
        a.answeredAt >= now - 14 * DAY_MS && a.answeredAt < now - 7 * DAY_MS
    );
    const acc = (arr: typeof answers) =>
      arr.length > 0
        ? arr.filter((a) => a.isCorrect).length / arr.length
        : null;
    const thisAcc = acc(thisWeek);
    const lastAcc = acc(lastWeek);
    const weeklyDelta =
      thisAcc !== null && lastAcc !== null
        ? Math.round((thisAcc - lastAcc) * 100)
        : null;

    // רצף — מתאפס אם היום ואתמול לא היו פעילים
    const today = israelDay();
    const yesterday = israelDay(now - DAY_MS);
    const streakDays =
      user?.lastActiveDay === today || user?.lastActiveDay === yesterday
        ? (user?.streakDays ?? 0)
        : 0;

    const dismissedIds = new Set(
      (
        await ctx.db
          .query('mistakeDismissals')
          .withIndex('by_user', (q) => q.eq('userId', userId))
          .collect()
      ).map((d) => d.questionId)
    );
    const mistakeCount = [...latest.entries()].filter(
      ([qId, ok]) => !ok && !dismissedIds.has(qId)
    ).length;
    const savedRows = await ctx.db
      .query('savedQuestions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    // כמה מבחני-מדמה עברת/נכשלת בהם (לא כולל תרגול — רק "מבחן תיאוריה אמיתי")
    const simulations = completed.filter((s) => s.mode === 'simulation');
    let passedSimCount = 0;
    let failedSimCount = 0;
    for (const s of simulations) {
      const incorrect = s.totalQuestions - s.correctCount;
      if (incorrect <= MAX_SIM_MISTAKES) {
        passedSimCount += 1;
      } else {
        failedSimCount += 1;
      }
    }

    // ספירה לאחור לתאריך המבחן (אם נקבע)
    const daysToTest = user?.testDate
      ? Math.ceil((user.testDate - now) / DAY_MS)
      : null;

    return {
      name: user?.fullName || user?.email?.split('@')[0] || 'תלמיד',
      readiness,
      readinessLabel,
      streakDays,
      weeklyDelta,
      questionsToBoost: Math.max(0, target - seen) > 0 ? 12 : 0,
      mistakeCount,
      savedCount: savedRows.length,
      totalQuizzes: completed.length,
      categories,
      correctAnswered: answers.filter((a) => a.isCorrect).length,
      testDate: user?.testDate ?? null,
      daysToTest,
      passedSimCount,
      failedSimCount,
    };
  },
});

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

// ==========================================================================
// פירוט הרצף (מסך שנפתח בלחיצה על היהלום) — כמה ימים, אילו ימים, תדירות
// ==========================================================================
export const getStreakDetail = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    const now = Date.now();

    const logs = await ctx.db
      .query('streakLog')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const activeDays = new Set(logs.map((l) => l.day));

    const today = israelDay();
    const yesterday = israelDay(now - DAY_MS);
    const currentStreak =
      user?.lastActiveDay === today || user?.lastActiveDay === yesterday
        ? (user?.streakDays ?? 0)
        : 0;

    // 30 הימים האחרונים, מהיום אחורה — לתצוגת "אילו ימים היו פעילים"
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const day = israelDay(now - i * DAY_MS);
      return { day, active: activeDays.has(day) };
    });

    // תדירות: אחוז הימים הפעילים מתוך החלון הרלוונטי (30 יום, או גיל
    // החשבון בימים אם הוא צעיר יותר — כדי לא "להעניש" חשבון חדש)
    const accountAgeDays = user
      ? Math.max(1, Math.floor((now - user.createdAt) / DAY_MS) + 1)
      : 30;
    const windowSize = Math.min(30, accountAgeDays);
    const activeInWindow = last30
      .slice(0, windowSize)
      .filter((d) => d.active).length;
    const frequencyPercent = Math.round((activeInWindow / windowSize) * 100);

    return {
      currentStreak,
      totalActiveDays: activeDays.size,
      last30,
      frequencyPercent,
    };
  },
});

// ==========================================================================
// טבלת דירוג כלל-משתמשים (מסך שנפתח בלחיצה על הטרופי) — לפי leaderboardScore
// המחושב מראש (ראו model.recomputeLeaderboardScore). לא חושף אימייל אף פעם —
// משתמש בלי שם מלא מוצג כ"משתמש".
// ==========================================================================
const LEADERBOARD_LIMIT = 200; // מספיק לשלב הנוכחי; ידרוש pagination בעתיד

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    const top = await ctx.db
      .query('users')
      .withIndex('by_leaderboardScore')
      .order('desc')
      .take(LEADERBOARD_LIMIT);

    const rows = top.map((u, i) => ({
      rank: i + 1,
      name: u.fullName?.trim() || 'משתמש',
      score: u.leaderboardScore ?? 0,
      isMe: u._id === userId,
    }));

    const myRow = rows.find((r) => r.isMe) ?? null;
    let me = myRow;
    if (!me) {
      // המשתמש לא בין המובילים — מחשבים את הדירוג שלו בנפרד כדי שתמיד יוצג
      const myUser = await ctx.db.get(userId);
      const myScore = myUser?.leaderboardScore ?? 0;
      const higher = await ctx.db
        .query('users')
        .withIndex('by_leaderboardScore', (q) =>
          q.gt('leaderboardScore', myScore)
        )
        .collect();
      me = {
        rank: higher.length + 1,
        name: myUser?.fullName?.trim() || 'משתמש',
        score: myScore,
        isMe: true,
      };
    }

    return { top: rows, me };
  },
});
