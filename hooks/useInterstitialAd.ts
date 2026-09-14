// ============================================================================
// שני מנגנוני interstitial נפרדים, לפי מסך:
//
// 1. תרגול (לפי נושא) + מחסן טעויות — onPracticeAnswered(): סופר תשובות
//    שנענו (משותף לשני המצבים) ומציג פרסומת כל 15 תשובות.
// 2. מבחן מדמה — showBeforeSimulation(): מוצג ברגע שלוחצים "התחל מבחן",
//    *לפני* שהמבחן נטען. אין הגבלת ספירה מהצד שלנו כאן — ה-Frequency Cap
//    היחיד על ההצגה הזו הוא מה שמוגדר ב-AdMob Dashboard (עד 2 ל-30 דק').
//    ⚠️ זו הצגה לפני תחילת סגמנט תוכן — מפורשות נוגדת את מדיניות ה-Better
//    Ads של Google Play (ר' config/ads.ts). הוחלט במודע ליישם למרות זאת.
//
// בשני המקרים לא מציגים למי שרכש הסרת פרסומות, ולא ב-Expo Go (הספרייה
// לא עובדת שם — צריך dev/prod build).
// ============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useCallback } from 'react';
import { getInterstitialAdUnitId } from '@/config/ads';
import { ADS_ENABLED } from '@/config/appConfig';

const PRACTICE_ANSWER_COUNT_KEY = 'adPracticeAnswerCount';
const SHOW_EVERY_N_ANSWERS = 15;
const LOAD_TIMEOUT_MS = 4000;

function isExpoGo(): boolean {
  try {
    return Constants.executionEnvironment === 'storeClient';
  } catch {
    return false;
  }
}

// מציג interstitial בפועל (טעינה + הצגה), ותמיד קורא ל-onDone בסוף —
// בין אם הוצגה פרסומת, נכשלה, או פסק הזמן. אף פעם לא נתקע.
async function showInterstitial(onDone: () => void): Promise<void> {
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
}

export function useInterstitialAd(adsRemoved: boolean) {
  const canShowAds = ADS_ENABLED && !adsRemoved && !isExpoGo();

  // תרגול / מחסן טעויות — לקרוא אחרי כל תשובה שנענתה. מציג כל 15 תשובות
  const onPracticeAnswered = useCallback(async () => {
    if (!canShowAds) {
      return;
    }
    try {
      const stored = await AsyncStorage.getItem(PRACTICE_ANSWER_COUNT_KEY);
      const count = (stored ? Number(stored) : 0) + 1;
      await AsyncStorage.setItem(PRACTICE_ANSWER_COUNT_KEY, String(count));
      if (count % SHOW_EVERY_N_ANSWERS === 0) {
        await showInterstitial(() => {});
      }
    } catch {
      // AsyncStorage נכשל — פשוט מדלגים הפעם, לא קריטי
    }
  }, [canShowAds]);

  // מבחן מדמה — לקרוא לפני ניווט למסך המבחן, בלחיצה על "התחל מבחן"
  const showBeforeSimulation = useCallback(
    (onDone: () => void) => {
      if (!canShowAds) {
        onDone();
        return;
      }
      showInterstitial(onDone);
    },
    [canShowAds]
  );

  return { onPracticeAnswered, showBeforeSimulation };
}
