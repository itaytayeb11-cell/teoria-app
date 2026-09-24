import * as TrackingTransparency from 'expo-tracking-transparency';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

// מבקש את הרשאת המעקב (App Tracking Transparency) הנדרשת ב-iOS 14.5+ לפני
// שימוש במזהה הפרסום של המכשיר (IDFA) לפרסומות מותאמות אישית (AdMob).
// חלון המערכת מוצג ע"י אפל בעצמה, פעם אחת בלבד לכל התקנה.
//
// למה ההמתנה וה-retry: iOS מתעלם בשקט מבקשת ATT אם האפליקציה לא במצב
// "active" באותו רגע, או אם חלון הרשאה אחר (למשל התראות) מוצג/מבוקש במקביל.
// אפל דחתה את ההגשה כי הבודק לא ראה את החלון. לכן: ממתינים ל-active + השהיה
// קצרה, ואם הסטטוס נשאר undetermined מנסים שוב בחזרה לקדמת המסך.
//
// מחזיר true כשהתהליך הסתיים (החלון נענה, או התייאשנו, או לא iOS) — רק אז
// מותר לבקש הרשאה נוספת (התראות Push) כדי שלא יתנגשו.
const ATT_DELAY_MS = 1500;
const MAX_ATTEMPTS = 3;

export function useTrackingPermission(enabled: boolean): boolean {
  const [settled, setSettled] = useState(Platform.OS !== 'ios');

  useEffect(() => {
    if (!enabled || Platform.OS !== 'ios') {
      return;
    }
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let sub: { remove: () => void } | undefined;

    const finish = () => {
      if (!cancelled) {
        setSettled(true);
      }
    };

    const attempt = async () => {
      attempts += 1;
      try {
        const current = await TrackingTransparency.getTrackingPermissionsAsync();
        if (current.status !== 'undetermined') {
          finish();
          return;
        }
        const result = await TrackingTransparency.requestTrackingPermissionsAsync();
        if (result.status !== 'undetermined') {
          finish();
          return;
        }
      } catch {
        finish();
        return;
      }
      // החלון לא הוצג/לא נענה — מנסים שוב כשהאפליקציה חוזרת לקדמת המסך
      if (attempts >= MAX_ATTEMPTS) {
        finish();
        return;
      }
      waitForActive();
    };

    const schedule = () => {
      timer = setTimeout(attempt, ATT_DELAY_MS);
    };

    const waitForActive = () => {
      if (AppState.currentState === 'active') {
        schedule();
        return;
      }
      sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          sub?.remove();
          schedule();
        }
      });
    };

    waitForActive();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
      sub?.remove();
    };
  }, [enabled]);

  return settled;
}
