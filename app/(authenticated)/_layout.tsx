import { useConvexAuth, useQuery } from 'convex/react';
import {
  Redirect,
  Stack,
  useRootNavigationState,
  useSegments,
} from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { PAYMENT_SYSTEM_ENABLED } from '@/config/appConfig';
import { palette } from '@/constants/Colors';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { api } from '@/convex/_generated/api';
import { usePushRegistration } from '@/hooks/usePushRegistration';

// כל המסכים שנפתחים "מעל" סרגל הטאבים (לא הטאבים עצמם — אלה חיים ב-(tabs)).
// כאן זה Stack אמיתי, אז ניווט קדימה/אחורה עובד עם היסטוריה רגילה (LIFO)
// ולא תלוי כלל במצב הפנימי של ניווט הטאבים — זה מה שתיקן את הבאג שבו
// יציאה ממסך (יהלום/תפריט/כל דבר) הייתה מסיימת בטאב אקראי/לא נכון.
const STACK_SCREENS = [
  'quiz',
  'results',
  'license',
  'stats',
  'history',
  'settings',
  'saved',
  'streak',
  'leaderboard',
  'faq',
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
  // אונבורדינג: משתמש בלי שם או בלי סוג רישיון — להשלים פרופיל לפני כניסה
  const onLicenseScreen = segments[segments.length - 1] === 'license';
  if (
    currentUser &&
    (!currentUser.licenseType || !currentUser.fullName) &&
    !onLicenseScreen
  ) {
    return <Redirect href="/(authenticated)/license" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      {STACK_SCREENS.map((name) => (
        <Stack.Screen key={name} name={name} />
      ))}
    </Stack>
  );
}
