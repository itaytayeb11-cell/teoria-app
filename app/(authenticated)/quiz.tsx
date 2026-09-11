import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bookmark, ChevronRight, Eye, Timer } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AnswerOption,
  Button,
  Card,
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

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function QuizScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    mode?: string;
    filter?: string;
    count?: string;
  }>();
  const mode = params.mode ?? 'simulation';
  const isPractice = mode !== 'simulation';
  const quiz = useQuiz();
  const toggleSave = useMutation(api.saved.toggle);
  const savedIds = useQuery(api.saved.listIds);
  const [showExplain, setShowExplain] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SIMULATION_SECONDS);
  const [elapsed, setElapsed] = useState(0);

  const startQuiz = quiz.start;
  useEffect(() => {
    // מסך זה חי בתוך Tabs ולא נטען מחדש כשעוברים בין מצבים (מבחן מדמה →
    // מחסן טעויות וכו') — לכן מאפסים כאן גם את מצב התצוגה המקומי, לא רק
    // את שאלות המבחן (אחרת נשארים עם טיימר/הסבר פתוח מהמבחן הקודם).
    setShowExplain(false);
    setConfirmExit(false);
    setSecondsLeft(SIMULATION_SECONDS);
    setElapsed(0);

    const startMode =
      mode === 'practice'
        ? 'category'
        : mode === 'mistakes' || mode === 'saved'
          ? mode
          : 'simulation';
    const count = params.count ? Number(params.count) : undefined;
    startQuiz({ mode: startMode, filterValue: params.filter, count });
  }, [startQuiz, mode, params.filter, params.count]);

  const { finish, sessionId, submitAll } = quiz;
  const correctCount = quiz.stats.correct;
  const goToResults = useCallback(async () => {
    if (!isPractice) {
      await submitAll(); // מבחן מדמה — שולח את כל התשובות לפני הסיום
    }
    const res = await finish();
    router.replace(
      `/(authenticated)/results?sessionId=${sessionId}&score=${res?.scorePercent ?? correctCount}`
    );
  }, [isPractice, submitAll, finish, sessionId, correctCount, router]);

  const hasQuestions = quiz.questions.length > 0;

  // מבחן מדמה — ספירה לאחור; תרגול — ספירה עולה
  useEffect(() => {
    if (!hasQuestions) {
      return;
    }
    const t = setInterval(() => {
      if (isPractice) {
        setElapsed((e) => e + 1);
      } else {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(t);
            goToResults();
            return 0;
          }
          return s - 1;
        });
      }
    }, 1000);
    return () => clearInterval(t);
  }, [isPractice, hasQuestions, goToResults]);

  const timeStr = useMemo(
    () => (isPractice ? fmt(elapsed) : fmt(secondsLeft)),
    [isPractice, elapsed, secondsLeft]
  );

  if (quiz.loading || quiz.questions.length === 0) {
    return (
      <Screen>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 24,
          }}
        >
          {quiz.error ? (
            <>
              <T center>{quiz.error}</T>
              <Button label="נסה שוב" onPress={quiz.retry} />
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
  const topic = q.subCategory ?? q.category;

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
    if (isPractice) {
      if (picked) {
        return;
      }
      quiz.answer(i, true);
      setShowExplain(true);
    } else {
      quiz.answer(i, false); // מבחן מדמה — אפשר לשנות
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

  const exit = () => {
    if (isPractice) {
      router.canGoBack() ? router.back() : router.replace('/(authenticated)');
    } else {
      setConfirmExit(true);
    }
  };

  return (
    <Screen edges={[]} style={{ backgroundColor: palette.primary }}>
      {/* כותרת — נמתחת מאחורי פס הסטטוס */}
      <View
        style={{
          flexDirection: rtl.flexDirection,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: insets.top + 8,
          paddingBottom: 14,
        }}
      >
        <Pressable onPress={exit} hitSlop={10}>
          <ChevronRight color="#fff" size={26} />
        </Pressable>
        <T color="#fff" weight="bold" size={17}>
          {isPractice ? 'תרגול — תיאוריה' : 'מבחן — תיאוריה'}
        </T>
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
      </View>

      <ScrollView
        style={{ backgroundColor: '#F4F5F7' }}
        contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 14 }}
      >
        {/* כרטיס התקדמות */}
        <Card style={{ gap: 10 }}>
          <View
            style={{
              flexDirection: rtl.flexDirection,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <T weight="bold" size={16}>
              שאלה {quiz.index + 1} מתוך {quiz.questions.length}
            </T>
            <View
              style={{
                backgroundColor: palette.primaryTint,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <T color={palette.primary} size={12} weight="medium">
                {topic}
              </T>
            </View>
          </View>
          <View
            style={{
              flexDirection: rtl.flexDirection,
              alignItems: 'center',
              gap: 8,
            }}
          >
            <View
              style={{
                flexDirection: rtl.flexDirection,
                alignItems: 'center',
                gap: 4,
                backgroundColor: '#F0F1F5',
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Timer color={palette.muted} size={14} />
              <T color={palette.muted} size={13} weight="medium">
                {timeStr}
              </T>
            </View>
          </View>
          <ProgressBar
            value={(quiz.index + 1) / quiz.questions.length}
            track={palette.primaryTint}
            fill={palette.primary}
          />
        </Card>

        {/* תמונה */}
        {q.imageUrl ? (
          <Card style={{ padding: 10 }}>
            <Image
              source={{ uri: q.imageUrl }}
              style={{ width: '100%', height: 200, backgroundColor: '#fff' }}
              resizeMode="contain"
            />
            <View
              style={{
                flexDirection: rtl.flexDirection,
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 8,
              }}
            >
              <View
                style={{
                  flexDirection: rtl.flexDirection,
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Eye color={palette.primary} size={15} />
                <T color={palette.muted} size={12}>
                  התבונן בפרטים בתמונה
                </T>
              </View>
              <T color={palette.success} size={12} weight="bold">
                שאלה רשמית
              </T>
            </View>
          </Card>
        ) : null}

        {/* שאלה */}
        <View
          style={{
            flexDirection: rtl.flexDirection,
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: palette.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
            }}
          >
            <T color="#fff" weight="bold" size={14}>
              ?
            </T>
          </View>
          <T weight="bold" size={18} style={{ flex: 1 }}>
            {q.text}
          </T>
        </View>

        {/* תשובות */}
        <View style={{ gap: 10 }}>
          {q.answers.map((ans, i) => (
            <AnswerOption
              key={`${q._id}-${i}`}
              text={ans}
              state={optionState(i)}
              disabled={isPractice && !!picked}
              onPress={() => onPick(i)}
            />
          ))}
        </View>

        {/* הסבר */}
        {isPractice && picked && q.explanation ? (
          <View
            style={{
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
      <View
        style={{
          backgroundColor: '#F4F5F7',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 12),
          gap: 12,
          borderTopWidth: 1,
          borderTopColor: '#E9EBF0',
        }}
      >
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
