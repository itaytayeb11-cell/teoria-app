import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bookmark, ChevronRight } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import {
  AnswerOption,
  Button,
  ConfirmModal,
  NavArrows,
  ProgressBar,
  Screen,
  T,
} from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { useQuiz } from '@/hooks/useQuiz';
import { rtl } from '@/lib/rtl';

const SIMULATION_SECONDS = 40 * 60;

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; filter?: string }>();
  const mode = params.mode ?? 'simulation';
  // כל המצבים חוץ ממבחן מדמה = תרגול עם משוב מיידי
  const isPractice = mode !== 'simulation';
  const quiz = useQuiz();
  const toggleSave = useMutation(api.saved.toggle);
  const savedIds = useQuery(api.saved.listIds);
  const [showExplain, setShowExplain] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SIMULATION_SECONDS);

  const startQuiz = quiz.start;
  useEffect(() => {
    // useQuiz מגן פנימית מפני קריאה כפולה (startedRef)
    const startMode =
      mode === 'practice'
        ? 'category'
        : mode === 'mistakes' || mode === 'saved'
          ? mode
          : 'simulation';
    startQuiz({ mode: startMode, filterValue: params.filter });
  }, [startQuiz, mode, params.filter]);

  const { finish, sessionId } = quiz;
  const correctCount = quiz.stats.correct;
  const goToResults = useCallback(async () => {
    const res = await finish();
    router.replace(
      `/(authenticated)/results?sessionId=${sessionId}&score=${res?.scorePercent ?? correctCount}`
    );
  }, [finish, sessionId, correctCount, router]);

  // טיימר למבחן מדמה
  const hasQuestions = quiz.questions.length > 0;
  useEffect(() => {
    if (isPractice || !hasQuestions) {
      return;
    }
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          goToResults();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isPractice, hasQuestions, goToResults]);

  useEffect(() => {
    setShowExplain(false);
  }, []);

  const timeStr = useMemo(() => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [secondsLeft]);

  if (quiz.loading || quiz.questions.length === 0) {
    return (
      <Screen>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          {quiz.error ? (
            <>
              <T center>{quiz.error}</T>
              <Button
                label="חזרה"
                variant="outline"
                onPress={() => router.back()}
              />
            </>
          ) : (
            <ActivityIndicator size="large" color={palette.primary} />
          )}
        </View>
      </Screen>
    );
  }

  const q = quiz.current;
  const picked = quiz.currentAnswer;
  const isLast = quiz.index === quiz.questions.length - 1;
  const isSaved = q ? (savedIds ?? []).includes(q._id as never) : false;

  const optionState = (
    i: number
  ): 'default' | 'selected' | 'correct' | 'wrong' => {
    if (!picked) {
      return 'default';
    }
    if (isPractice) {
      if (i === q.correctAnswer) {
        return 'correct';
      }
      if (i === picked.selected) {
        return 'wrong';
      }
      return 'default';
    }
    return i === picked.selected ? 'selected' : 'default';
  };

  const onPick = (i: number) => {
    if (picked) {
      return;
    }
    quiz.answer(i);
    if (isPractice) {
      setShowExplain(true);
    }
  };

  const onNext = () => {
    setShowExplain(false);
    if (isLast) {
      if (isPractice) {
        goToResults();
      } else {
        setConfirmExit(true);
      }
      return;
    }
    quiz.next();
  };

  return (
    <Screen edges={['top']}>
      {/* כותרת מבחן */}
      <View
        style={{
          backgroundColor: palette.primary,
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 18,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View
          style={{
            flexDirection: rtl.flexDirection,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Pressable
            onPress={() => setConfirmExit(true)}
            hitSlop={10}
            style={{
              flexDirection: rtl.flexDirection,
              alignItems: 'center',
              gap: 4,
            }}
          >
            <T color="#fff" weight="medium">
              {isPractice ? 'סיום תרגול' : 'סיום מבחן'}
            </T>
            <ChevronRight color="#fff" size={22} />
          </Pressable>
          {q ? (
            <Pressable
              hitSlop={10}
              onPress={() => toggleSave({ questionId: q._id as never })}
            >
              <Bookmark
                color="#fff"
                size={22}
                fill={isSaved ? '#fff' : 'transparent'}
              />
            </Pressable>
          ) : null}
        </View>
        <View style={{ marginTop: 12, marginBottom: 8 }}>
          <ProgressBar value={(quiz.index + 1) / quiz.questions.length} />
        </View>
        <View
          style={{
            flexDirection: rtl.flexDirection,
            justifyContent: 'space-between',
          }}
        >
          <T color="#fff" weight="bold">
            {quiz.index + 1} מתוך {quiz.questions.length}
          </T>
          {!isPractice && (
            <T color="#fff" weight="bold">
              ⏱ {timeStr}
            </T>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {q.imageUrl ? (
          <Image
            source={{ uri: q.imageUrl }}
            style={{
              width: '100%',
              height: 200,
              borderRadius: 12,
              marginBottom: 16,
              backgroundColor: '#fff',
            }}
            resizeMode="contain"
          />
        ) : null}

        <T weight="bold" size={19} style={{ marginBottom: 16 }}>
          {q.text}
        </T>

        <View style={{ gap: 12 }}>
          {q.answers.map((ans, i) => (
            <AnswerOption
              key={`${q._id}-${i}`}
              text={ans}
              state={optionState(i)}
              disabled={!!picked}
              onPress={() => onPick(i)}
            />
          ))}
        </View>

        {isPractice && picked && q.explanation ? (
          <View
            style={{
              marginTop: 16,
              backgroundColor: '#F3F0FF',
              borderRadius: 12,
              padding: 14,
            }}
          >
            <Pressable
              onPress={() => setShowExplain((v) => !v)}
              style={{
                flexDirection: rtl.flexDirection,
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <T color={palette.explain} weight="bold">
                {showExplain ? '▲' : '▼'}
              </T>
              <T color={palette.explain} weight="bold">
                הסבר
              </T>
            </Pressable>
            {showExplain ? (
              <T style={{ marginTop: 8 }} color="#4B3FA8">
                {q.explanation}
              </T>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* ניווט תחתון */}
      <View style={{ padding: 16, gap: 12 }}>
        {isPractice ? (
          <Button
            label={isLast ? 'סיום' : picked ? 'הבא' : 'דלג'}
            onPress={onNext}
          />
        ) : (
          <>
            <NavArrows
              onPrev={quiz.prev}
              onNext={isLast ? () => setConfirmExit(true) : quiz.next}
              prevDisabled={quiz.index === 0}
            />
            {isLast ? (
              <Button label="סיים מבחן" onPress={() => setConfirmExit(true)} />
            ) : null}
          </>
        )}
      </View>

      <ConfirmModal
        visible={confirmExit}
        title={isPractice ? 'לסיים את התרגול?' : 'לסיים את המבחן?'}
        message={
          isPractice
            ? 'תוכל לחזור ולתרגל שוב בכל עת.'
            : 'המבחן ייחתם עם התשובות שסימנת עד עכשיו.'
        }
        confirmLabel="כן, סיים"
        cancelLabel="חזרה למבחן"
        onConfirm={goToResults}
        onCancel={() => setConfirmExit(false)}
      />
    </Screen>
  );
}
