import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { type MutationCtx, mutation, query } from './_generated/server';
import { filterByLicense, requireUserId, shuffle } from './model';

const SIMULATION_SIZE = 30; // מספר שאלות במבחן מדמה

const modeValidator = v.union(
  v.literal('category'),
  v.literal('difficulty'),
  v.literal('simulation'),
  v.literal('all')
);

// אוסף את מאגר השאלות המתאים למצב המבחן שנבחר
async function pickPool(
  ctx: MutationCtx,
  mode: 'category' | 'difficulty' | 'simulation' | 'all',
  filterValue?: string
): Promise<Doc<'questions'>[]> {
  if (mode === 'category' && filterValue) {
    const pool = await ctx.db
      .query('questions')
      .withIndex('by_category', (q) => q.eq('category', filterValue))
      .collect();
    return pool.filter((q) => q.isActive);
  }

  if (mode === 'difficulty' && filterValue) {
    const level = Number(filterValue);
    const pool = await ctx.db
      .query('questions')
      .withIndex('by_difficulty', (q) => q.eq('difficulty', level))
      .collect();
    return pool.filter((q) => q.isActive);
  }

  const pool = await ctx.db
    .query('questions')
    .withIndex('by_active', (q) => q.eq('isActive', true))
    .collect();
  return pool;
}

// ==========================================================================
// התחלת מבחן חדש
// ==========================================================================
export const startQuiz = mutation({
  args: {
    mode: modeValidator,
    filterValue: v.optional(v.string()),
    count: v.optional(v.number()),
  },
  handler: async (ctx, { mode, filterValue, count }) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);

    const rawPool = await pickPool(ctx, mode, filterValue);
    const pool = filterByLicense(rawPool, user?.licenseType);
    if (pool.length === 0) {
      throw new Error('אין שאלות זמינות למבחן הזה');
    }

    const desired =
      mode === 'simulation' ? SIMULATION_SIZE : (count ?? pool.length);
    const chosen = shuffle(pool).slice(0, Math.min(desired, pool.length));
    const questionIds = chosen.map((q) => q._id);

    const sessionId = await ctx.db.insert('quizSessions', {
      userId,
      mode,
      filterValue,
      questionIds,
      answers: [],
      totalQuestions: questionIds.length,
      correctCount: 0,
      incorrectCount: 0,
      scorePercent: 0,
      status: 'in_progress',
      startedAt: Date.now(),
    });

    return {
      sessionId,
      questions: chosen.map((q) => ({
        _id: q._id,
        text: q.text,
        answers: q.answers,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        category: q.category,
        difficulty: q.difficulty,
        imageUrl: q.imageUrl,
      })),
    };
  },
});

// ==========================================================================
// שמירת תשובה בודדת (נקרא בכל לחיצה על תשובה)
// ==========================================================================
export const submitAnswer = mutation({
  args: {
    sessionId: v.id('quizSessions'),
    questionId: v.id('questions'),
    selected: v.number(),
  },
  handler: async (ctx, { sessionId, questionId, selected }) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(sessionId);

    if (!session || session.userId !== userId) {
      throw new Error('מבחן לא נמצא');
    }
    if (session.status === 'completed') {
      throw new Error('המבחן כבר הסתיים');
    }

    const question = await ctx.db.get(questionId);
    if (!question) {
      throw new Error('שאלה לא נמצאה');
    }

    const isCorrect = selected === question.correctAnswer;

    // מונע רישום כפול של אותה שאלה
    const already = session.answers.some((a) => a.questionId === questionId);
    if (!already) {
      const answers = [...session.answers, { questionId, selected, isCorrect }];
      const correctCount = answers.filter((a) => a.isCorrect).length;
      const incorrectCount = answers.length - correctCount;

      await ctx.db.patch(sessionId, {
        answers,
        correctCount,
        incorrectCount,
      });

      await ctx.db.insert('answerLog', {
        userId,
        questionId,
        category: question.category,
        isCorrect,
        answeredAt: Date.now(),
      });
    }

    return { isCorrect, correctAnswer: question.correctAnswer };
  },
});

// ==========================================================================
// סיום מבחן — חישוב ציון סופי
// ==========================================================================
export const finishQuiz = mutation({
  args: { sessionId: v.id('quizSessions') },
  handler: async (ctx, { sessionId }) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(sessionId);

    if (!session || session.userId !== userId) {
      throw new Error('מבחן לא נמצא');
    }

    const correctCount = session.answers.filter((a) => a.isCorrect).length;
    const scorePercent =
      session.totalQuestions > 0
        ? Math.round((correctCount / session.totalQuestions) * 100)
        : 0;

    await ctx.db.patch(sessionId, {
      status: 'completed',
      completedAt: Date.now(),
      correctCount,
      incorrectCount: session.totalQuestions - correctCount,
      scorePercent,
    });

    return { scorePercent, correctCount, total: session.totalQuestions };
  },
});

// ==========================================================================
// שליפת מבחן פעיל (להמשך אחרי יציאה מהאפליקציה)
// ==========================================================================
export const getActiveSession = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query('quizSessions')
      .withIndex('by_user_status', (q) =>
        q.eq('userId', userId).eq('status', 'in_progress')
      )
      .order('desc')
      .first();
  },
});

// שליפת מבחן לפי מזהה (למסך תוצאות)
export const getSession = query({
  args: { sessionId: v.id('quizSessions') },
  handler: async (ctx, { sessionId }) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(sessionId);
    if (!session || session.userId !== userId) {
      return null;
    }

    // מצרף את נוסח השאלות למסך סקירת שגיאות
    const questionsById = new Map<Id<'questions'>, Doc<'questions'>>();
    for (const qId of session.questionIds) {
      const q = await ctx.db.get(qId);
      if (q) {
        questionsById.set(qId, q);
      }
    }

    return {
      ...session,
      review: session.answers.map((a) => {
        const q = questionsById.get(a.questionId);
        return {
          questionId: a.questionId,
          text: q?.text ?? '',
          answers: q?.answers ?? [],
          selected: a.selected,
          correctAnswer: q?.correctAnswer ?? -1,
          explanation: q?.explanation,
          isCorrect: a.isCorrect,
        };
      }),
    };
  },
});
