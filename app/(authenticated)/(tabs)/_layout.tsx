import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import {
  AlertCircle,
  Home,
  ListChecks,
  TrafficCone,
} from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/constants/Colors';
import { needsExplicitRTL } from '@/lib/rtl';

// טאבים גלויים בסרגל התחתון (בסדר RTL: הראשון מימין).
// כל המסכים ה"נסתרים" (quiz/results/settings/וכו') עברו החוצה לניווט
// Stack של app/(authenticated)/_layout.tsx — הם כבר לא Tabs.Screen בכלל,
// כך שאין להם שום השפעה על מצב/היסטוריית ה-Tabs הזה יותר (זו הייתה הסיבה
// לבאג ש"יציאה ממסך מסתיימת בטאב הלא נכון")
const TABS = [
  { name: 'index', title: 'בית', icon: Home },
  { name: 'practice', title: 'תרגול', icon: ListChecks },
  { name: 'signs', title: 'תמרורים', icon: TrafficCone },
  { name: 'mistakes', title: 'מחסן טעויות', icon: AlertCircle },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // סרגל צף עם שוליים מכל הצדדים — Liquid Glass: רקע לבן-שקוף עם גוון כחול
  // עדין, מטושטש. הטאב הפעיל מסומן רק בצבע (כחול) — בלי "כדור" רקע לבן.
  const barBottom = Math.max(insets.bottom, 14);

  // הטאב-בר עצמו הוא 'row' רגיל שלא מתהפך אוטומטית ל-RTL (בניגוד לרוב
  // הרכיבים באפליקציה) — ב-Expo Go זה גורם לטאבים להיראות בסדר הפוך
  // (בית משמאל במקום מימין). באנדרואיד/iOS build עם RTL טבעי הסדר המקורי
  // כבר נכון, אז הופכים את המערך רק כשצריך RTL מפורש.
  const orderedTabs = needsExplicitRTL() ? [...TABS].reverse() : TABS;

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: '#9AA3B2',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: barBottom,
          height: 68,
          paddingTop: 8,
          paddingHorizontal: 8,
          borderTopWidth: 0,
          borderRadius: 31,
          backgroundColor: 'transparent',
          elevation: 0,
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          <BlurView
            intensity={35}
            tint="light"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: 'rgba(234,241,254,0.45)',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: 'rgba(29,78,216,0.12)',
              },
            ]}
          />
        ),
      }}
    >
      {orderedTabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, size }) => (
              <t.icon color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
