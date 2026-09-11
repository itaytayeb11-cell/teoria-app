import { useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import {
  Button,
  Card,
  RingProgress,
  Screen,
  ScreenHeader,
  T,
} from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

const MAX_SIM_MISTAKES = 4; // עד 4 שגיאות = עובר במבחן המדמה

export default function ResultsScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const session = useQuery(
    api.quiz.getSession,
    sessionId ? { sessionId: sessionId as never } : 'skip'
  );

  if (session === undefined) {
    return (
      <Screen>
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </Screen>
    );
  }

  if (session === null) {
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
          <T center>לא נמצאו תוצאות</T>
          <Button
            label="חזרה לבית"
            onPress={() => router.replace('/(authenticated)')}
          />
        </View>
      </Screen>
    );
  }

  const isSim = session.mode === 'simulation';
  const wrong = session.review.filter((r) => !r.isCorrect);
  const incorrectCount = session.totalQuestions - session.correctCount;
  const passed = isSim
    ? incorrectCount <= MAX_SIM_MISTAKES
    : session.scorePercent >= 74;
  const accent = passed ? palette.success : palette.danger;

  return (
    <Screen edges={[]}>
      <ScreenHeader
        title={isSim ? 'תוצאות המבחן' : 'סיכום התרגול'}
        onBack={() => router.replace('/(authenticated)')}
        backLabel="בית"
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card style={{ alignItems: 'center', paddingVertical: 24, gap: 10 }}>
          <RingProgress
            value={session.scorePercent}
            size={128}
            color={accent}
            label={`${session.correctCount}/${session.totalQuestions}`}
          />
          <T weight="bold" size={18} color={accent}>
            {passed
              ? isSim
                ? 'עברת! 🎉'
                : 'כל הכבוד!'
              : isSim
                ? `לא עברת — ${incorrectCount} שגיאות (מותר עד ${MAX_SIM_MISTAKES})`
                : 'יש עוד מה לחזק'}
          </T>
          <T color={palette.muted} size={13} center>
            {session.correctCount} נכון · {incorrectCount} שגוי מתוך{' '}
            {session.totalQuestions}
          </T>
        </Card>

        {wrong.length > 0 ? (
          <View style={{ gap: 12 }}>
            <T weight="bold" size={17}>
              טעויות ({wrong.length})
            </T>
            {wrong.map((r) => (
              <Card key={r.questionId} style={{ gap: 6 }}>
                <T weight="medium">{r.text}</T>
                {r.selected >= 0 ? (
                  <T color={palette.danger} size={14}>
                    ✕ תשובתך: {r.answers[r.selected]}
                  </T>
                ) : (
                  <T color={palette.danger} size={14}>
                    ✕ לא ענית
                  </T>
                )}
                <T color={palette.success} size={14}>
                  ✓ נכון: {r.answers[r.correctAnswer]}
                </T>
                {r.explanation ? (
                  <T
                    color="#4B3FA8"
                    size={13}
                    style={{ textAlign: rtl.textAlign }}
                  >
                    {r.explanation}
                  </T>
                ) : null}
              </Card>
            ))}
          </View>
        ) : (
          <Card>
            <T center weight="medium" color={palette.success}>
              כל התשובות נכונות — מצוין!
            </T>
          </Card>
        )}

        <View style={{ gap: 10, marginTop: 4 }}>
          {wrong.length > 0 ? (
            <Button
              label="תרגל את הטעויות"
              onPress={() =>
                router.replace('/(authenticated)/quiz?mode=mistakes')
              }
            />
          ) : null}
          <Button
            label={isSim ? 'מבחן חדש' : 'תרגול נוסף'}
            variant={wrong.length > 0 ? 'outline' : 'primary'}
            onPress={() =>
              router.replace(
                isSim
                  ? '/(authenticated)/quiz?mode=simulation'
                  : '/(authenticated)/practice'
              )
            }
          />
          <Button
            label="חזרה לבית"
            variant="outline"
            onPress={() => router.replace('/(authenticated)')}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
