import { useConvexAuth, useQuery } from 'convex/react';
import { BlurView } from 'expo-blur';
import {
  Redirect,
  Tabs,
  useRootNavigationState,
  useSegments,
} from 'expo-router';
import {
  AlertCircle,
  Home,
  ListChecks,
  TrafficCone,
} from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PAYMENT_SYSTEM_ENABLED } from '@/config/appConfig';
import { palette } from '@/constants/Colors';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { api } from '@/convex/_generated/api';
import { usePushRegistration } from '@/hooks/usePushRegistration';

// טאבים גלויים בסרגל התחתון (בסדר RTL: הראשון מימין)
const TABS = [
  { name: 'index', title: 'בית', icon: Home },
  { name: 'practice', title: 'תרגול', icon: ListChecks },
  { name: 'signs', title: 'תמרורים', icon: TrafficCone },
  { name: 'mistakes', title: 'מחסן טעויות', icon: AlertCircle },
];

// מסכים נגישים דרך ניווט אך מוסתרים מסרגל הטאבים.
// focus=true — גם מסתירים את סרגל הטאבים עצמו (מסכי מיקוד / כפתורים תחתונים)
const HIDDEN: { name: string; focus?: boolean }[] = [
  { name: 'quiz', focus: true },
  { name: 'results', focus: true },
  { name: 'license', focus: true },
  { name: 'stats' },
  { name: 'history' },
  { name: 'settings' },
  { name: 'saved' },
];

export default function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { isPremium, isLoading: isRevenueCatLoading } = useRevenueCat();
  const navigationState = useRootNavigationState();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : 'skip'
  );

  usePushRegistration(isAuthenticated);

  const loadingView = (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F4F5F7',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator size="large" color={palette.primary} />
    </View>
  );

  if (!navigationState?.key) {
    return loadingView;
  }
  if (isLoading || isRevenueCatLoading) {
    return loadingView;
  }
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  if (PAYMENT_SYSTEM_ENABLED && !isPremium) {
    return <Redirect href="/(auth)/paywall" />;
  }
  // אונבורדינג: משתמש בלי סוג רישיון — לבחור לפני כניסה לאפליקציה
  const onLicenseScreen = segments[segments.length - 1] === 'license';
  if (currentUser && !currentUser.licenseType && !onLicenseScreen) {
    return <Redirect href="/(authenticated)/license" />;
  }

  // סרגל צף עם שוליים מכל הצדדים — Liquid Glass: רקע לבן-שקוף עם גוון כחול
  // עדין (לא כחול רווי!), מטושטש, הטאב הפעיל מקבל "כדור" לבן מאחוריו
  const barBottom = Math.max(insets.bottom, 14);

  return (
    <Tabs
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
          height: 62,
          paddingTop: 6,
          paddingHorizontal: 8,
          borderTopWidth: 0,
          borderRadius: 31,
          backgroundColor: 'transparent',
          elevation: 0,
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          <BlurView
            intensity={45}
            tint="light"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: 'rgba(234,241,254,0.72)',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: 'rgba(29,78,216,0.12)',
              },
            ]}
          />
        ),
        tabBarItemStyle: {
          marginVertical: 4,
          marginHorizontal: 3,
          borderRadius: 22,
        },
        tabBarActiveBackgroundColor: '#fff',
        tabBarInactiveBackgroundColor: 'transparent',
      }}
    >
      {TABS.map((t) => (
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
      {HIDDEN.map((s) => (
        <Tabs.Screen
          key={s.name}
          name={s.name}
          options={{
            href: null,
            ...(s.focus ? { tabBarStyle: { display: 'none' } } : {}),
          }}
        />
      ))}
    </Tabs>
  );
}
