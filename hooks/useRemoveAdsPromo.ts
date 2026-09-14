// ============================================================================
// פופ-אפ פרסום "הסרת פרסומות" בתוך האפליקציה — לא קשור ל-AdMob, רק
// חלון מודעה משלנו שמופיע פעם ב-יומיים כדי להזכיר על הרכישה החד-פעמית.
// ============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const LAST_SHOWN_KEY = 'removeAdsPromoLastShown';
const SHOW_EVERY_MS = 2 * 24 * 60 * 60 * 1000; // פעם ב-יומיים

export function useRemoveAdsPromo(enabled: boolean) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LAST_SHOWN_KEY);
        const last = stored ? Number(stored) : 0;
        if (Date.now() - last >= SHOW_EVERY_MS) {
          setVisible(true);
          await AsyncStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
        }
      } catch {
        // AsyncStorage נכשל — פשוט מדלגים הפעם, לא קריטי
      }
    })();
  }, [enabled]);

  return { visible, dismiss: () => setVisible(false) };
}
