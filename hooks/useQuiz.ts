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
      setLoading(true);
      setError(null);
      try {
        const res = await startQuizMut(params);
        setSessionId(res.sessionId);
        setQuestions(res.questions as QuizQuestion[]);
        setIndex(0);
        setAnswers({});
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה בטעינת המבחן');
        startedRef.current = false;
      } finally {
        setLoading(false);
      }
    },
    [startQuizMut]
  );

  const answer = useCallback(
    async (selected: number) => {
      const q = questions[index];
      if (!q || !sessionId || answers[index]) {
        return;
      }
      const isCorrect = selected === q.correctAnswer;
      setAnswers((prev) => ({ ...prev, [index]: { selected, isCorrect } }));
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
    answer,
    next,
    prev,
    goTo: setIndex,
    finish,
  };
}
