import { useQuery } from 'convex/react';
import { ActivityIndicator, View } from 'react-native';
import { Card, Screen, ScreenHeader, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

const WEEKDAY_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']; // 0=ראשון..6=שבת

// כיתוב עידוד לפי אורך הרצף האמיתי — בלי מספרים/אחוזים, פשוט וברור
function encouragement(streak: number): string {
  if (streak <= 0) {
    return 'עוד לא התחלת רצף — כל רצף מתחיל ביום אחד 💪';
  }
  if (streak === 1) {
    return 'יום ראשון ברצף — תמשיך ככה מחר!';
  }
  if (streak < 4) {
    return 'רצף יפה! אל תעצור עכשיו.';
  }
  if (streak < 7) {
    return 'אתה על אש! ממשיך חזק 🔥';
  }
  return 'רצף מרשים! אתה ברמה אחרת 🚀';
}

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
        <View style={{ padding: 16, gap: 20 }}>
          {/* גיבור — יהלום גדול + מספר גדול + עידוד */}
          <View style={{ alignItems: 'center', paddingVertical: 12, gap: 6 }}>
            <T size={64}>💎</T>
            <T weight="bold" size={34} color={palette.primary}>
              {detail.currentStreak}
            </T>
            <T weight="bold" size={16}>
              {detail.currentStreak === 1 ? 'יום ברצף' : 'ימים ברצף'}
            </T>
            <T color={palette.muted} size={13} center style={{ marginTop: 4 }}>
              {encouragement(detail.currentStreak)}
            </T>
          </View>

          {/* השבוع האחרון — שורת ימים פשוטה, לא רשת מספרים */}
          <Card>
            <T weight="bold" size={15} style={{ marginBottom: 14 }}>
              השבוע האחרון
            </T>
            <View
              style={{
                flexDirection: rtl.flexDirection,
                justifyContent: 'space-between',
              }}
            >
              {[...detail.last30.slice(0, 7)].reverse().map((d) => {
                const weekday =
                  WEEKDAY_LETTERS[new Date(`${d.day}T12:00:00`).getDay()];
                return (
                  <View key={d.day} style={{ alignItems: 'center', gap: 6 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: d.active ? palette.primary : '#EDEFF4',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <T size={16}>{d.active ? '💎' : ''}</T>
                    </View>
                    <T color={palette.muted} size={12}>
                      {weekday}
                    </T>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* סה"כ — שורה אחת, לא כרטיס נפרד עם אחוזים */}
          <T color={palette.muted} size={13} center>
            סה"כ תרגלת ב-{detail.totalActiveDays} ימים שונים
          </T>
        </View>
      )}
    </Screen>
  );
}
