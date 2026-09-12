import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { type MutationCtx, mutation, query } from './_generated/server';
import {
  filterByLicense,
  latestAnswerByQuestion,
  requireUserId,
  shuffle,
  touchStreak,
} from './model';

const SIMULATION_SIZE = 30; // מספר שאלות במבחן מדמה

const modeValidator = v.union(
  v.literal('category'),
  v.literal('difficulty'),
  v.literal('simulation'),
  v.literal('all'),
  v.literal('mistakes'),
  v.literal('saved')
);

// אוסף את מאגר השאלות המתאים למצב המבחן שנבחר
async function pickPool(
  ctx: MutationCtx,
  mode: 'category' | 'difficulty' | 'simulation' | 'all' | 'mistakes' | 'saved',
  userId: Id<'users'>,
  filterValue?: string
): Promise<Doc<'questions'>[]> {
  if (mode === 'mistakes') {
    const logs = await ctx.db
      .query('answerLog')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const latest = latestAnswerByQuestion(logs);
    const dismissed = new Set(
      (
        await ctx.db
          .query('mistakeDismissals')
          .withIndex('by_user', (q) => q.eq('userId', userId))
          .collect()
      ).map((d) => d.questionId)
    );
    const ids = [...latest.entries()]
      .filter(([qId, ok]) => !ok && !dismissed.has(qId))
      .map(([id]) => id);
    const docs = await Promise.all(ids.map((id) => ctx.db.get(id)));
    return docs
      .filter((d): d is Doc<'questions'> => d !== null)
      .filter((d) => d.isActive);
  }

  if (mode === 'saved') {
    const rows = await ctx.db
      .query('savedQuestions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const docs = await Promise.all(rows.map((r) => ctx.db.get(r.questionId)));
    return docs
      .filter((d): d is Doc<'questions'> => d !== null)
      .filter((d) => d.isActive);
  }

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

    const rawPool = await pickPool(ctx, mode, userId, filterValue);
    // מחסן טעויות ושמורות — לא מסננים לפי רישיון (המשתמש כבר נענה עליהן)
    const pool =
      mode === 'mistakes' || mode === 'saved'
        ? rawPool
        : filterByLicense(rawPool, user?.licenseType);
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
        subCategory: q.subCategory,
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

    const question = await ctx.db.get(questionId);
    if (!question) {
      throw new Error('שאלה לא נמצאה');
    }

    const isCorrect = selected === question.correctAnswer;

    // אם המבחן כבר הסתיים — זה תשובה שנשלחה באיחור (submitAll מול finish
    // שרצים כמעט ביחד). לא כותבים לסשן שכבר ננעל, אבל גם לא זורקים שגיאה
    // שהמשתמש יראה — פשוט מחזירים את התוצאה בלי שינוי.
    if (session.status === 'completed') {
      return { isCorrect, correctAnswer: question.correctAnswer };
    }

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
        subCategory: question.subCategory,
        isCorrect,
        selected,
        answeredAt: Date.now(),
      });
      await touchStreak(ctx, userId);

      // אם טעה שוב — מוציאים אותה מ"ידעתי" כדי שתחזור למחסן הטעויות
      if (!isCorrect) {
        const dismissal = await ctx.db
          .query('mistakeDismissals')
          .withIndex('by_user_question', (q) =>
            q.eq('userId', userId).eq('questionId', questionId)
          )
          .first();
        if (dismissal) {
          await ctx.db.delete(dismissal._id);
        }
      }
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

// שליפת מבחן פעיל להמשך — כולל נוסח כל השאלות, בפורמט זהה ל-startQuiz
export const getResumable = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db
      .query('quizSessions')
      .withIndex('by_user_status', (q) =>
        q.eq('userId', userId).eq('status', 'in_progress')
      )
      .order('desc')
      .first();
    if (!session) {
      return null;
    }

    const questions = [];
    for (const qId of session.questionIds) {
      const q = await ctx.db.get(qId);
      if (q) {
        questions.push({
          _id: q._id,
          text: q.text,
          answers: q.answers,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          category: q.category,
          subCategory: q.subCategory,
          difficulty: q.difficulty,
          imageUrl: q.imageUrl,
        });
      }
    }

    return {
      sessionId: session._id,
      mode: session.mode,
      filterValue: session.filterValue,
      totalQuestions: session.totalQuestions,
      answeredCount: session.answers.length,
      questions,
      answers: session.answers,
    };
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

    // עוברים על כל השאלות של המבחן (session.questionIds) ולא רק על אלה
    // שיש להן תשובה שמורה — אחרת שאלה שדולגה לגמרי (מבחן מדמה: המשתמש
    // עבר "הבא" בלי לבחור) פשוט נעלמת מסקירת הטעויות, בעוד שהיא כן
    // נספרת כלא-נכונה בציון (finishQuiz סופר לפי totalQuestions).
    const answersByQuestion = new Map(
      session.answers.map((a) => [a.questionId, a])
    );
    const review = session.questionIds.map((qId) => {
      const q = questionsById.get(qId);
      const a = answersByQuestion.get(qId);
      return {
        questionId: qId,
        text: q?.text ?? '',
        answers: q?.answers ?? [],
        selected: a?.selected ?? -1, // -1 = לא נענתה (דולגה)
        correctAnswer: q?.correctAnswer ?? -1,
        explanation: q?.explanation,
        isCorrect: a?.isCorrect ?? false,
      };
    });

    return { ...session, review };
  },
});
