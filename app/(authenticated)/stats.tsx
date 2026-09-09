import { useQuery } from 'convex/react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Card, Screen, ScreenHeader, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

export default function StatsScreen() {
  const stats = useQuery(api.stats.getMyStats);

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="מעקב" highlight="התקדמות" />
      {stats === undefined ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Stat label="ציון ממוצע" value={`${stats.averageScore}%`} />
            <Stat label="מבחנים" value={String(stats.totalQuizzes)} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Stat label="שאלות שנענו" value={String(stats.totalAnswered)} />
            <Stat
              label="דיוק כללי"
              value={
                stats.totalAnswered
                  ? `${Math.round((stats.totalCorrect / stats.totalAnswered) * 100)}%`
                  : '—'
              }
            />
          </View>

          {stats.weakCategory ? (
            <Card>
              <T color={palette.muted} size={13}>
                נושא לחיזוק
              </T>
              <T weight="bold" size={18} style={{ marginTop: 2 }}>
                {stats.weakCategory} ({stats.weakCategoryAccuracy}%)
              </T>
            </Card>
          ) : null}

          {stats.categoryBreakdown.length > 0 ? (
            <Card>
              <T weight="bold" size={16} style={{ marginBottom: 10 }}>
                דיוק לפי נושא
              </T>
              {stats.categoryBreakdown.map((c) => (
                <View
                  key={c.category}
                  style={{
                    flexDirection: rtl.flexDirection,
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                  }}
                >
                  <T weight="medium">{c.accuracy}%</T>
                  <T>{c.category}</T>
                </View>
              ))}
            </Card>
          ) : (
            <Card>
              <T center color={palette.muted}>
                עוד לא תרגלת. התחל מבחן כדי לראות נתונים.
              </T>
            </Card>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

function Stat(props: { label: string; value: string }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', paddingVertical: 18 }}>
      <T weight="bold" size={24} color={palette.primary}>
        {props.value}
      </T>
      <T color={palette.muted} size={13} center style={{ marginTop: 4 }}>
        {props.label}
      </T>
    </Card>
  );
}
