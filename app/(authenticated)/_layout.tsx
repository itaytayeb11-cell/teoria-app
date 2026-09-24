import { useConvexAuth, useQuery } from 'convex/react';
import {
  Redirect,
  Stack,
  useRootNavigationState,
  useSegments,
} from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { palette } from '@/constants/Colors';
import { useTrackingSettled } from '@/contexts/TrackingContext';
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
  'remove-ads',
];

export default function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const navigationState = useRootNavigationState();
  const segments = useSegments();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : 'skip'
  );

  // ATT קודם, ורק אחריו התראות Push — שני חלונות הרשאה במקביל: iOS מציג
  // רק אחד ומתעלם בשקט מהשני (זה מה שגרם ל-ATT לא להופיע בבדיקת אפל)
  const trackingSettled = useTrackingSettled();
  usePushRegistration(isAuthenticated && trackingSettled);

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
  if (isLoading) {
    return loadingView;
  }
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  // אפליקציה חינמית — אין חסימת תוכן מאחורי תשלום. "הסרת פרסומות" היא
  // רכישה אופציונלית שנגישה דרך התפריט, לא גייט שחוסם כניסה.
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
