// ============================================================================
// הרשאת מעקב (App Tracking Transparency) — iOS בלבד
// ============================================================================
// אפל דחתה פעמיים את ההגשה (Guideline 2.1) כי הבודק לא מצא את חלון ה-ATT
// כשהוא נפתח אוטומטית. לכן: מסך הסבר קצר בהפעלה הראשונה, וחלון ה-ATT של iOS
// נפתח רק בעקבות לחיצה של המשתמש על "המשך" — בקשה שנובעת מלחיצה מתבצעת כשהאפליקציה
// פעילה בוודאות, ואף חלון אחר לא מתחרה עליה.
//
// המסך הוא שכבה רגילה (View) ולא Modal — שני Modal/חלון מערכת יחד תקעו את
// המסך ב-iOS בעבר. אם ההחלטה כבר התקבלה (או אין ATT בפלטפורמה) — לא מוצג כלום.
import * as TrackingTransparency from 'expo-tracking-transparency';
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, T } from '@/components/ui';
import { palette } from '@/constants/Colors';

type Status = 'loading' | 'needs-prompt' | 'done';
const MAX_TAPS = 3;

// true כשהחלטת ה-ATT התקבלה (או לא רלוונטי) — רק אז מותר לבקש הרשאות נוספות
const TrackingSettledContext = createContext<boolean>(true);

export function useTrackingSettled(): boolean {
  return useContext(TrackingSettledContext);
}

export function TrackingProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(
    Platform.OS === 'ios' ? 'loading' : 'done'
  );
  const [busy, setBusy] = useState(false);
  const [taps, setTaps] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    let cancelled = false;
    TrackingTransparency.getTrackingPermissionsAsync()
      .then((current) => {
        if (!cancelled) {
          setStatus(
            current.status === 'undetermined' ? 'needs-prompt' : 'done'
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('done');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onContinue = useCallback(async () => {
    setBusy(true);
    let answered = true;
    try {
      const result =
        await TrackingTransparency.requestTrackingPermissionsAsync();
      answered = result.status !== 'undetermined';
    } catch {
      answered = true;
    }
    setBusy(false);
    const nextTaps = taps + 1;
    setTaps(nextTaps);
    // אם iOS לא הציג את החלון (נשאר undetermined) — נותנים ללחוץ שוב, עד 3 פעמים
    if (answered || nextTaps >= MAX_TAPS) {
      setStatus('done');
    }
  }, [taps]);

  return (
    <TrackingSettledContext.Provider value={status === 'done'}>
      {children}
      {status === 'needs-prompt' ? (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <T size={44} center>
              📢
            </T>
            <T weight="bold" size={24} center style={{ marginTop: 12 }}>
              פרסומות מותאמות אישית
            </T>
            <T
              color={palette.muted}
              size={15}
              center
              style={{ marginTop: 12, lineHeight: 24 }}
            >
              האפליקציה חינמית ונתמכת בפרסומות. בחלון הבא של iOS תוכל לבחור אם
              לאפשר לנו להציג לך פרסומות שמתאימות יותר לך. הבחירה שלך לא משפיעה
              על השימוש באפליקציה, ותוכל לשנות אותה בכל עת בהגדרות המכשיר.
            </T>
            <View style={{ marginTop: 28, alignSelf: 'stretch' }}>
              <Button label="המשך" onPress={onContinue} loading={busy} />
            </View>
          </View>
        </View>
      ) : null}
    </TrackingSettledContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 1000,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
  },
});
