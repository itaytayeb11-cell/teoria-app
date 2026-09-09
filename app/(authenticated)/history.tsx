import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Card, Screen, ScreenHeader, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

const MODE_LABEL: Record<string, string> = {
  simulation: 'מבחן מדמה',
  category: 'תרגול נושא',
  difficulty: 'לפי קושי',
  all: 'כללי',
};

export default function HistoryScreen() {
  const router = useRouter();
  const history = useQuery(api.stats.getHistory);

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="היסטוריית" highlight="מבחנים" />
      {history === undefined ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : history.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <T center color={palette.muted}>
            עוד לא סיימת מבחן. אחרי מבחן ראשון הוא יופיע כאן.
          </T>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {history.map((h) => (
            <Card
              key={h._id}
              onPress={() =>
                router.push(`/(authenticated)/results?sessionId=${h._id}`)
              }
              style={{
                flexDirection: rtl.flexDirection,
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <T
                weight="bold"
                size={20}
                color={h.scorePercent >= 74 ? palette.success : palette.danger}
              >
                {h.scorePercent}%
              </T>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <T weight="medium">
                  {MODE_LABEL[h.mode] ?? h.mode}
                  {h.filterValue ? ` · ${h.filterValue}` : ''}
                </T>
                <T color={palette.muted} size={13}>
                  {h.correctCount}/{h.totalQuestions} נכון
                  {h.completedAt
                    ? ` · ${new Date(h.completedAt).toLocaleDateString('he-IL')}`
                    : ''}
                </T>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
