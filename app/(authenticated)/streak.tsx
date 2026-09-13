import { useQuery } from 'convex/react';
import { ActivityIndicator, View } from 'react-native';
import { Card, Screen, ScreenHeader, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

export default function StreakScreen() {
  const detail = useQuery(api.stats.getStreakDetail);

  return (
    <Screen edges={[]}>
      <ScreenHeader title="פירוט" highlight="הרצף" />
      {detail === undefined ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : (
        <View style={{ padding: 16, gap: 16 }}>
          <Card
            style={{
              flexDirection: rtl.flexDirection,
              alignItems: 'center',
              gap: 16,
            }}
          >
            <T size={40}>💎</T>
            <View style={{ flex: 1 }}>
              <T weight="bold" size={26} color={palette.primary}>
                {detail.currentStreak} ימים ברצף
              </T>
              <T color={palette.muted} size={13} style={{ marginTop: 2 }}>
                השלמת מבחן/תרגול ביום מוסיפה יהלום. דילוג על יום מאפס.
              </T>
            </View>
          </Card>

          <View style={{ flexDirection: rtl.flexDirection, gap: 10 }}>
            <Card style={{ flex: 1, alignItems: 'center' }}>
              <T weight="bold" size={22} color={palette.primary}>
                {detail.totalActiveDays}
              </T>
              <T
                color={palette.muted}
                size={12}
                center
                style={{ marginTop: 2 }}
              >
                ימי תרגול בסה"כ
              </T>
            </Card>
            <Card style={{ flex: 1, alignItems: 'center' }}>
              <T weight="bold" size={22} color={palette.primary}>
                {detail.frequencyPercent}%
              </T>
              <T
                color={palette.muted}
                size={12}
                center
                style={{ marginTop: 2 }}
              >
                תדירות (30 יום אחרונים)
              </T>
            </Card>
          </View>

          <Card>
            <T weight="bold" size={15} style={{ marginBottom: 12 }}>
              30 הימים האחרונים
            </T>
            <View
              style={{
                flexDirection: rtl.flexDirection,
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {[...detail.last30].reverse().map((d) => {
                const dayNum = Number(d.day.slice(-2));
                return (
                  <View
                    key={d.day}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: d.active ? palette.primary : '#EDEFF4',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <T
                      size={11}
                      weight="medium"
                      color={d.active ? '#fff' : palette.muted}
                    >
                      {dayNum}
                    </T>
                  </View>
                );
              })}
            </View>
            <T color={palette.muted} size={11} style={{ marginTop: 10 }}>
              ריבוע כחול = יום שבו הושלם מבחן או תרגול
            </T>
          </Card>
        </View>
      )}
    </Screen>
  );
}
