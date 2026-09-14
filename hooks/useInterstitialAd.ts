// ============================================================================
// פרסומת interstitial בין sessions — לא בתוך תוכן לימוד עצמו.
// מוצגת לכל היותר פעם בכל 3 מבחנים/תרגולים שהושלמו, ורק למי שלא רכש
// "הסרת פרסומות" ורק כש-ADS_ENABLED דלוק. ב-Expo Go תמיד מדלגים (הספרייה
// לא עובדת שם — צריך dev/prod build).
// ============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useCallback } from 'react';
import { getInterstitialAdUnitId } from '@/config/ads';
import { ADS_ENABLED } from '@/config/appConfig';

const SESSION_COUNT_KEY = 'adInterstitialSessionCount';
const SHOW_EVERY_N_SESSIONS = 3;
const LOAD_TIMEOUT_MS = 4000;

function isExpoGo(): boolean {
  try {
    return Constants.executionEnvironment === 'storeClient';
  } catch {
    return false;
  }
}

export function useInterstitialAd(adsRemoved: boolean) {
  // מנסה להציג פרסומת (לא יותר מפעם ב-3 סשנים) ואז תמיד קורא ל-onDone —
  // בין אם הוצגה פרסומת, נכשלה, פסקה זמן, או שלא היה מקום להציג בכלל.
  // הקורא ממשיך לניווט הבא (מסך תוצאות) מתוך onDone, אף פעם לא נתקע.
  const maybeShowAfterQuiz = useCallback(
    async (onDone: () => void) => {
      if (!ADS_ENABLED || adsRemoved || isExpoGo()) {
        onDone();
        return;
      }

      let count = 1;
      try {
        const stored = await AsyncStorage.getItem(SESSION_COUNT_KEY);
        count = (stored ? Number(stored) : 0) + 1;
        await AsyncStorage.setItem(SESSION_COUNT_KEY, String(count));
      } catch {
        // אם AsyncStorage נכשל — פשוט לא מציגים פרסומת הפעם, לא נתקעים
        onDone();
        return;
      }

      if (count % SHOW_EVERY_N_SESSIONS !== 0) {
        onDone();
        return;
      }

      let finished = false;
      let cleanup = () => {};
      const finish = () => {
        if (finished) {
          return;
        }
        finished = true;
        cleanup();
        onDone();
      };

      try {
        const { InterstitialAd, AdEventType } = await import(
          'react-native-google-mobile-ads'
        );
        const interstitial = InterstitialAd.createForAdRequest(
          getInterstitialAdUnitId()
        );

        const unsubLoaded = interstitial.addAdEventListener(
          AdEventType.LOADED,
          () => interstitial.show()
        );
        const unsubClosed = interstitial.addAdEventListener(
          AdEventType.CLOSED,
          finish
        );
        const unsubError = interstitial.addAdEventListener(
          AdEventType.ERROR,
          finish
        );
        const timeout = setTimeout(finish, LOAD_TIMEOUT_MS);
        cleanup = () => {
          clearTimeout(timeout);
          unsubLoaded();
          unsubClosed();
          unsubError();
        };

        interstitial.load();
      } catch {
        finish();
      }
    },
    [adsRemoved]
  );

  return { maybeShowAfterQuiz };
}
