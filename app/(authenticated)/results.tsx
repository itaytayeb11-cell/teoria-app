import { useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Button, Card, Screen, ScreenHeader, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

const PASS_MARK = 74; // ציון עובר בתאוריה בישראל

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
          }}
        >
          <T>לא נמצאו תוצאות</T>
          <Button
            label="חזרה לבית"
            onPress={() => router.replace('/(authenticated)')}
          />
        </View>
      </Screen>
    );
  }

  const score = session.scorePercent;
  const passed = score >= PASS_MARK;
  const wrong = session.review.filter((r) => !r.isCorrect);

  return (
    <Screen edges={['top']}>
      <ScreenHeader
        title="תוצאות"
        onBack={() => router.replace('/(authenticated)')}
        backLabel="בית"
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <T
            weight="bold"
            size={48}
            color={passed ? palette.success : palette.danger}
          >
            {score}%
          </T>
          <T weight="medium" size={16} style={{ marginTop: 4 }}>
            {session.correctCount} מתוך {session.totalQuestions} נכון
          </T>
          <T
            color={passed ? palette.success : palette.danger}
            weight="bold"
            style={{ marginTop: 8 }}
          >
            {passed ? 'עברת! 🎉' : `לא עברת (צריך ${PASS_MARK}%)`}
          </T>
        </Card>

        {wrong.length > 0 ? (
          <View style={{ gap: 12 }}>
            <T weight="bold" size={17}>
              טעויות ({wrong.length})
            </T>
            {wrong.map((r) => (
              <Card key={r.questionId}>
                <T weight="medium" style={{ marginBottom: 8 }}>
                  {r.text}
                </T>
                {r.selected >= 0 ? (
                  <T color={palette.danger} size={14}>
                    ✕ תשובתך: {r.answers[r.selected]}
                  </T>
                ) : (
                  <T color={palette.danger} size={14}>
                    ✕ לא ענית
                  </T>
                )}
                <T color={palette.success} size={14} style={{ marginTop: 2 }}>
                  ✓ נכון: {r.answers[r.correctAnswer]}
                </T>
                {r.explanation ? (
                  <T
                    color="#4B3FA8"
                    size={13}
                    style={{ marginTop: 6, textAlign: rtl.textAlign }}
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
              כל הכבוד — כל התשובות נכונות!
            </T>
          </Card>
        )}

        <View style={{ gap: 10, marginTop: 8 }}>
          <Button
            label="חזרה לבית"
            onPress={() => router.replace('/(authenticated)')}
          />
          <Button
            label="מבחן חדש"
            variant="outline"
            onPress={() =>
              router.replace('/(authenticated)/quiz?mode=simulation')
            }
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
