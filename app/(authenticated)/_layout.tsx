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

// מסכים נגישים דרך ניווט אך מוסתרים מסרגל הטאבים
const HIDDEN = [
  'quiz',
  'results',
  'stats',
  'history',
  'license',
  'settings',
  'saved',
];

export default function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { isPremium, isLoading: isRevenueCatLoading } = useRevenueCat();
  const navigationState = useRootNavigationState();
  const segments = useSegments();
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: '#9AA3B2',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11 },
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
      {HIDDEN.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
