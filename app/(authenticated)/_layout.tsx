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
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
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

  const barHeight = 56 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: '#9AA3B2',
        tabBarLabelStyle: { fontSize: 11, marginBottom: 2 },
        // Liquid Glass — סרגל שקוף עם טשטוש, מרחף מעל התוכן
        tabBarStyle: {
          position: 'absolute',
          height: barHeight,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          borderTopWidth: 0,
          backgroundColor:
            Platform.OS === 'android'
              ? 'rgba(255,255,255,0.94)'
              : 'transparent',
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={40}
            tint="light"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: 'rgba(255,255,255,0.55)',
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: 'rgba(0,0,0,0.06)',
              },
            ]}
          />
        ),
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
