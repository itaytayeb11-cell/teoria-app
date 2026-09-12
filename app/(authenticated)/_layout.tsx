import { useConvexAuth, useQuery } from 'convex/react';
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
import { ActivityIndicator, View } from 'react-native';
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

  const barHeight = 64 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.7)',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        // סרגל כחול מלא — הטאב הפעיל מקבל "כדור" לבן מאחורי האייקון/תווית
        tabBarStyle: {
          position: 'absolute',
          height: barHeight,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          paddingHorizontal: 10,
          borderTopWidth: 0,
          backgroundColor: palette.primary,
          elevation: 0,
        },
        tabBarItemStyle: {
          marginVertical: 4,
          marginHorizontal: 3,
          borderRadius: 18,
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
