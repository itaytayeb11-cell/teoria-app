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
  const startedRef = useRef(false);
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
      if (startedRef.current) {
        return;
      }
      startedRef.current = true;
      lastParamsRef.current = params;
      setLoading(true);
      setError(null);
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
        startedRef.current = false;
      } finally {
        setLoading(false);
      }
    },
    [startQuizMut]
  );

  const retry = useCallback(() => {
    if (lastParamsRef.current) {
      startedRef.current = false;
      start(lastParamsRef.current);
    }
  }, [start]);

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

  // שולח את כל התשובות המקומיות לשרת (מבחן מדמה, לפני סיום)
  const submitAll = useCallback(async () => {
    if (!sessionId) {
      return;
    }
    for (const [i, rec] of Object.entries(answers)) {
      const q = questions[Number(i)];
      if (!q) {
        continue;
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
    }
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
    answer,
    submitAll,
    next,
    prev,
    goTo: setIndex,
    finish,
  };
}
