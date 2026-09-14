// ============================================================================
// קונפיגורציית AdMob — מזהי יחידות פרסומת
// ============================================================================
// ⚠️ react-native-google-mobile-ads לא עובד ב-Expo Go — רק ב-dev/prod build
// (ר' ADS_ENABLED ב-config/appConfig.ts). בזמן פיתוח תמיד משתמשים במזהי
// הטסט הרשמיים של גוגל (למטה) כדי לא להסתכן בהפרות מדיניות מלחיצות אמיתיות
// על פרסומות בזמן טסטים.

import { Platform } from 'react-native';
import { ADS_ENABLED } from './appConfig';

// מזהי טסט רשמיים של גוגל (תמיד מציגים פרסומת דמה) — https://developers.google.com/admob/android/test-ads
const TEST_INTERSTITIAL_ANDROID = 'ca-app-pub-3940256099942544/1033173712';
const TEST_INTERSTITIAL_IOS = 'ca-app-pub-3940256099942544/4411468910';
const TEST_BANNER_ANDROID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_BANNER_IOS = 'ca-app-pub-3940256099942544/2934735716';

// 👤 נדרשת פעולת משתמש: להחליף למזהי היחידות האמיתיים שלך מ-AdMob לפני
// שמדליקים ADS_ENABLED=true בפרודקשן. עד אז אלה placeholder בלבד.
const PROD_INTERSTITIAL_ANDROID = 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY';
const PROD_INTERSTITIAL_IOS = 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ';
const PROD_BANNER_ANDROID = 'ca-app-pub-XXXXXXXXXXXXXXXX/WWWWWWWWWW';
const PROD_BANNER_IOS = 'ca-app-pub-XXXXXXXXXXXXXXXX/VVVVVVVVVV';

// 👤 נדרשת פעולת משתמש: ב-AdMob Dashboard, על יחידת ה-interstitial —
// Frequency Capping: מקסימום 2 חשיפות כל 30 דקות. זו הגדרה שנקבעת בדשבורד
// של גוגל, לא בקוד.
//
// ⚠️⚠️ סיכון מדיניות ידוע, שאושר במפורש על ידי המשתמש (2026-09-14):
// ה-interstitial במבחן מדמה מוצג *לפני* תחילת המבחן (בלחיצה על "התחל
// מבחן", לפני שהמבחן נטען) — ר' hooks/useInterstitialAd.showBeforeSimulation
// ואת נקודות הקריאה ב-app/(authenticated)/(tabs)/index.tsx ו-results.tsx.
// זו בדיוק דוגמת ההפרה הרשמית שגוגל מצטטת במדיניות ה-Better Ads של
// Google Play: פרסומת בתחילת סגמנט תוכן. הסיכון: גוגל עלולה לעצור הצגת
// פרסומות לאפליקציה (ad serving disabled, הכנסה 0 מפרסומות) עד תיקון
// ואישור מחדש — בלי אזהרה מראש. הוחלט ליישם את זה במודע למרות הסיכון.
// אם בעתיד יש בעיית ad serving disabled — זה קרוב לוודאי המקור, ושווה
// לשקול הסרת ה-interstitial הזה כתיקון ראשון.
//
// ה-interstitial בתרגול/מחסן טעויות (כל 15 תשובות, hooks/useInterstitialAd
// .onPracticeAnswered) לא נוגע לבעיה הזו — הוא בין שאלות, לא לפני סגמנט.
export function getInterstitialAdUnitId(): string {
  const useTestId = __DEV__ || !ADS_ENABLED;
  if (Platform.OS === 'ios') {
    return useTestId ? TEST_INTERSTITIAL_IOS : PROD_INTERSTITIAL_IOS;
  }
  return useTestId ? TEST_INTERSTITIAL_ANDROID : PROD_INTERSTITIAL_ANDROID;
}

export function getBannerAdUnitId(): string {
  const useTestId = __DEV__ || !ADS_ENABLED;
  if (Platform.OS === 'ios') {
    return useTestId ? TEST_BANNER_IOS : PROD_BANNER_IOS;
  }
  return useTestId ? TEST_BANNER_ANDROID : PROD_BANNER_ANDROID;
}
