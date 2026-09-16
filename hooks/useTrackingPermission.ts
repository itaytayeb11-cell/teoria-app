import * as TrackingTransparency from 'expo-tracking-transparency';
import { useEffect } from 'react';

// מבקש את הרשאת המעקב (App Tracking Transparency) הנדרשת ב-iOS 14.5+ לפני
// שימוש במזהה הפרסום של המכשיר (IDFA) לפרסומות מותאמות אישית (AdMob).
// חלון המערכת מוצג ע"י אפל בעצמה, פעם אחת בלבד לכל התקנה — קריאות חוזרות
// (בכל פתיחה של האפליקציה) פשוט מחזירות את הסטטוס השמור, לא מציגות שוב.
// לא רלוונטי באנדרואיד (ה-hook לא עושה כלום שם).
export function useTrackingPermission(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    TrackingTransparency.getTrackingPermissionsAsync().then((current) => {
      if (current.status === 'undetermined') {
        TrackingTransparency.requestTrackingPermissionsAsync();
      }
    });
  }, [enabled]);
}
