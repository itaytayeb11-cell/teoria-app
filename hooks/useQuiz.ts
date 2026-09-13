// hook לניהול מבחן/תרגול — עוטף את פונקציות Convex ב-convex/quiz.ts
import { useMutation } from 'convex/react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { api } from '@/convex/_generated/api';

export type QuizMode = 'simulation' | 'practice' | 'category';

export type QuizQuestion = {
  _id: string;
  text: string;
  answers: string[];
  correctAnswer: number;
  explanation?: string;
  category: string;
  subCategory?: string;
  difficulty: number;
  imageUrl?: string;
};

type AnswerRecord = { selected: number; isCorrect: boolean };

export function useQuiz() {
  const startQuizMut = useMutation(api.quiz.startQuiz);
  const submitAnswerMut = useMutation(api.quiz.submitAnswer);
  const finishQuizMut = useMutation(api.quiz.finishQuiz);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerRecord>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // מפתח הפרמטרים של המבחן שכבר נטען. חייב (לא boolean) כי מסכי טאבים
  // (quiz/results/...) לא נטענים מחדש כשעוברים בין מצבים שונים באותו
  // מסלול — אם היינו רק שומרים "כבר התחלנו", מעבר ממבחן מדמה לתרגול
  // טעויות היה משאיר את שאלות המבחן הקודם על המסך.
  const startedKeyRef = useRef<string | null>(null);
  const lastParamsRef = useRef<Parameters<typeof startQuizMut>[0] | null>(null);

  const start = useCallback(
    async (params: {
      mode:
        | 'category'
        | 'difficulty'
        | 'simulation'
        | 'all'
        | 'mistakes'
        | 'saved';
      filterValue?: string;
      count?: number;
    }) => {
      const key = JSON.stringify(params);
      if (startedKeyRef.current === key) {
        return;
      }
      startedKeyRef.current = key;
      lastParamsRef.current = params;
      setLoading(true);
      setError(null);
      setSessionId(null);
      setQuestions([]);
      setIndex(0);
      setAnswers({});
      try {
        const res = await startQuizMut(params);
        setSessionId(res.sessionId);
        setQuestions(res.questions as QuizQuestion[]);
        setIndex(0);
        setAnswers({});
      } catch (e) {
        setError(
          e instanceof Error && e.message
            ? e.message
            : 'לא הצלחנו לטעון את המבחן. בדוק את החיבור לאינטרנט ונסה שוב.'
        );
        startedKeyRef.current = null;
      } finally {
        setLoading(false);
      }
    },
    [startQuizMut]
  );

  const retry = useCallback(() => {
    if (lastParamsRef.current) {
      startedKeyRef.current = null;
      start(lastParamsRef.current);
    }
  }, [start]);

  // טוען מבחן שכבר קיים (המשך מבחן שנקטע) — בלי ליצור סשן חדש בשרת.
  // ממשיך מהשאלה הראשונה שעדיין לא נענתה (לפי מה שבאמת נשמר בשרת).
  const loadResumed = useCallback(
    (data: {
      sessionId: string;
      questions: QuizQuestion[];
      answers: { questionId: string; selected: number; isCorrect: boolean }[];
    }) => {
      const key = `resume:${data.sessionId}`;
      if (startedKeyRef.current === key) {
        return;
      }
      startedKeyRef.current = key;
      lastParamsRef.current = null;

      const answersByIndex: Record<number, AnswerRecord> = {};
      for (const a of data.answers) {
        const idx = data.questions.findIndex((q) => q._id === a.questionId);
        if (idx >= 0) {
          answersByIndex[idx] = {
            selected: a.selected,
            isCorrect: a.isCorrect,
          };
        }
      }
      const firstUnanswered = data.questions.findIndex(
        (_, i) => answersByIndex[i] === undefined
      );

      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setAnswers(answersByIndex);
      setIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
      setError(null);
      setLoading(false);
    },
    []
  );

  // תרגול: מסמן, נועל, ושולח מיד (למשוב מיידי).
  // מבחן מדמה: רק מסמן מקומית — אפשר לשנות עד הסיום (immediate=false).
  const answer = useCallback(
    async (selected: number, immediate = true) => {
      const q = questions[index];
      if (!q || !sessionId) {
        return;
      }
      if (immediate && answers[index]) {
        return; // בתרגול לא משנים תשובה שכבר נענתה
      }
      const isCorrect = selected === q.correctAnswer;
      setAnswers((prev) => ({ ...prev, [index]: { selected, isCorrect } }));
      if (!immediate) {
        return;
      }
      try {
        await submitAnswerMut({
          sessionId: sessionId as never,
          questionId: q._id as never,
          selected,
        });
      } catch {
        // נשמר מקומית גם אם הרשת נכשלה
      }
    },
    [questions, index, sessionId, answers, submitAnswerMut]
  );

  // שולח את כל התשובות המקומיות לשרת (מבחן מדמה, לפני סיום).
  // כל הקריאות יוצאות במקביל (לא await בלולאה) — עד 30 שאלות בהמתנה
  // עוקבת = כמה שניות טעינה, בעוד שבמקביל זה בערך זמן קריאה בודדת.
  const submitAll = useCallback(async () => {
    if (!sessionId) {
      return;
    }
    await Promise.all(
      Object.entries(answers).map(async ([i, rec]) => {
        const q = questions[Number(i)];
        if (!q) {
          return;
        }
        try {
          await submitAnswerMut({
            sessionId: sessionId as never,
            questionId: q._id as never,
            selected: rec.selected,
          });
        } catch {
          // ממשיכים גם אם תשובה אחת נכשלה
        }
      })
    );
  }, [sessionId, answers, questions, submitAnswerMut]);

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, questions.length - 1));
  }, [questions.length]);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const finish = useCallback(async () => {
    if (!sessionId) {
      return null;
    }
    try {
      return await finishQuizMut({ sessionId: sessionId as never });
    } catch {
      return null;
    }
  }, [sessionId, finishQuizMut]);

  const stats = useMemo(() => {
    const answered = Object.keys(answers).length;
    const correct = Object.values(answers).filter((a) => a.isCorrect).length;
    return { answered, correct, total: questions.length };
  }, [answers, questions.length]);

  return {
    sessionId,
    questions,
    index,
    current: questions[index],
    currentAnswer: answers[index],
    answers,
    loading,
    error,
    stats,
    start,
    retry,
    loadResumed,
    answer,
    submitAll,
    next,
    prev,
    goTo: setIndex,
    finish,
  };
}
