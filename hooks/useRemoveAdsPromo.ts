// ============================================================================
// פופ-אפ פרסום "הסרת פרסומות" בתוך האפליקציה — לא קשור ל-AdMob, רק
// חלון מודעה משלנו שמופיע פעם ב-יומיים כדי להזכיר על הרכישה החד-פעמית.
// ============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const LAST_SHOWN_KEY = 'removeAdsPromoLastShown';
const SHOW_EVERY_MS = 2 * 24 * 60 * 60 * 1000; // פעם ב-יומיים
// השהיה לפני הצגה — כדי שלא יתנגש עם Modal אחר שנסגר ממש עכשיו
const SHOW_DELAY_MS = 800;

export function useRemoveAdsPromo(enabled: boolean) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LAST_SHOWN_KEY);
        // הפעלה ראשונה אי פעם: לא מציגים. Modal שנפתח יחד עם חלון ה-ATT של
        // iOS תקע את המסך (אי אפשר לגלול עד הפעלה מחדש) — הפרסום הראשון
        // יופיע רק כעבור יומיים
        if (!stored) {
          await AsyncStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
          return;
        }
        if (Date.now() - Number(stored) >= SHOW_EVERY_MS) {
          timer = setTimeout(async () => {
            if (cancelled) {
              return;
            }
            setVisible(true);
            await AsyncStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
          }, SHOW_DELAY_MS);
        }
      } catch {
        // AsyncStorage נכשל — פשוט מדלגים הפעם, לא קריטי
      }
    })();
    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [enabled]);

  return { visible, dismiss: () => setVisible(false) };
}
