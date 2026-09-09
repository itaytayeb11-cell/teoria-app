import { useQuery } from 'convex/react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Card, Screen, ScreenHeader, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

const TREND_TEXT = {
  up: { label: 'אתה במגמת שיפור 📈', color: palette.success },
  down: { label: 'הציונים ירדו לאחרונה 📉', color: palette.danger },
  flat: { label: 'הציונים יציבים', color: palette.muted },
};

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

          {/* מגמת ציונים */}
          {stats.scoreTrend.length >= 2 ? (
            <Card>
              <View
                style={{
                  flexDirection: rtl.flexDirection,
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                {stats.trendDirection ? (
                  <T
                    weight="bold"
                    size={13}
                    color={TREND_TEXT[stats.trendDirection].color}
                  >
                    {TREND_TEXT[stats.trendDirection].label}
                  </T>
                ) : (
                  <View />
                )}
                <T weight="bold" size={16}>
                  מגמת ציונים
                </T>
              </View>
              <TrendChart data={stats.scoreTrend.map((p) => p.score)} />
            </Card>
          ) : null}

          {/* נושאים חלשים (תת-נושא) */}
          {stats.weakSubCategories.length > 0 ? (
            <Card>
              <T weight="bold" size={16} style={{ marginBottom: 4 }}>
                כדאי לחזק
              </T>
              <T color={palette.muted} size={13} style={{ marginBottom: 10 }}>
                הנושאים שבהם אתה הכי מתקשה
              </T>
              {stats.weakSubCategories.map((s) => (
                <View
                  key={s.subCategory}
                  style={{
                    flexDirection: rtl.flexDirection,
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                  }}
                >
                  <T
                    weight="bold"
                    color={s.accuracy < 60 ? palette.danger : palette.warning}
                  >
                    {s.accuracy}%
                  </T>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <T weight="medium">{s.subCategory}</T>
                    <T color={palette.muted} size={12}>
                      {s.category} · {s.correct}/{s.total}
                    </T>
                  </View>
                </View>
              ))}
            </Card>
          ) : null}

          {/* פירוט מלא לפי תת-נושא */}
          {stats.subCategoryBreakdown.length > 0 ? (
            <Card>
              <T weight="bold" size={16} style={{ marginBottom: 10 }}>
                דיוק לפי נושא
              </T>
              {stats.subCategoryBreakdown.map((c) => (
                <View
                  key={c.subCategory}
                  style={{
                    flexDirection: rtl.flexDirection,
                    justifyContent: 'space-between',
                    paddingVertical: 5,
                  }}
                >
                  <T weight="medium">{c.accuracy}%</T>
                  <T style={{ flex: 1, marginHorizontal: 10 }}>
                    {c.subCategory}
                  </T>
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

// גרף עמודות פשוט — גובה כל עמודה לפי הציון
function TrendChart(props: { data: number[] }) {
  const max = 100;
  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          height: 120,
          gap: 6,
        }}
      >
        {props.data.map((v, i) => (
          <View
            // biome-ignore lint/suspicious/noArrayIndexKey: מדד סדרתי יציב
            key={i}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'flex-end',
              height: '100%',
            }}
          >
            <T size={10} color={palette.muted}>
              {v}
            </T>
            <View
              style={{
                width: '100%',
                height: `${Math.max(4, (v / max) * 100)}%`,
                backgroundColor:
                  v >= 74 ? palette.success : palette.primarySoft,
                borderRadius: 4,
              }}
            />
          </View>
        ))}
      </View>
      <View
        style={{
          height: 1,
          backgroundColor: palette.primaryTint,
        }}
      />
      <T size={11} color={palette.muted} center>
        קו עובר: 74%
      </T>
    </View>
  );
}
