// ============================================================================
// באנר AdMob — מוצג קבוע בתחתית מסך המבחן המדמה בלבד (לא תרגול). לא עובד
// ב-Expo Go, אז טוען את הספרייה דינמית ורק אם לא ב-Expo Go ואם ADS_ENABLED —
// אותו דפוס בדיוק שכבר בשימוש ב-RevenueCatContext.tsx לספריות native דומות.
// ============================================================================
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { getBannerAdUnitId } from '@/config/ads';
import { ADS_ENABLED } from '@/config/appConfig';

function isExpoGo(): boolean {
  try {
    return Constants.executionEnvironment === 'storeClient';
  } catch {
    return false;
  }
}

// ה-props של הרכיבים שנטענים דינמית — לא מייבאים את הטיפוסים מהחבילה עצמה
// ברמת המודול (זה כבר היה גורם לניסיון resolve בזמן טעינה). טיפוס רופף
// בכוונה — אנחנו מזינים רק unitId/size, לא צריך את כל טיפוסי הספרייה כאן.
type AdModule = {
  BannerAd: React.ComponentType<any>;
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: string };
};

export function AdBanner(props: { adsRemoved: boolean }) {
  const [mod, setMod] = useState<AdModule | null>(null);

  useEffect(() => {
    if (props.adsRemoved || !ADS_ENABLED || isExpoGo()) {
      return;
    }
    let cancelled = false;
    import('react-native-google-mobile-ads')
      .then((m) => {
        if (!cancelled) {
          setMod({ BannerAd: m.BannerAd, BannerAdSize: m.BannerAdSize });
        }
      })
      .catch(() => {
        // אין מודול native (Expo Go / בעיית טעינה) — פשוט לא מציגים באנר
      });
    return () => {
      cancelled = true;
    };
  }, [props.adsRemoved]);

  if (!mod || props.adsRemoved) {
    return null;
  }

  const { BannerAd, BannerAdSize } = mod;
  return (
    <View
      style={{
        width: '100%',
        alignItems: 'center',
        backgroundColor: '#F4F5F7',
      }}
    >
      <BannerAd
        unitId={getBannerAdUnitId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      />
    </View>
  );
}
