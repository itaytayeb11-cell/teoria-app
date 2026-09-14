import { useRouter } from 'expo-router';
import { Ban, Heart, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Screen, T } from '@/components/ui';
import { WebViewModal } from '@/components/WebViewModal';
import { PRIVACY_URL, TERMS_URL } from '@/config/appConfig';
import { palette } from '@/constants/Colors';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { rtl } from '@/lib/rtl';

// האפליקציה כולה חינמית ופתוחה — המסך הזה לא "פותח" שום דבר, רק מסיר
// פרסומות. חשוב שזה יהיה ברור בניסוח, אחרת זה נשמע כמו פתיחת תוכן
const REASONS: { icon: typeof Ban; label: string }[] = [
  { icon: Ban, label: 'בלי פרסומות בכלל — לא בין מבחנים ולא בשום מקום אחר' },
  { icon: Zap, label: 'תרגול רציף וחלק, בלי הפרעות' },
  { icon: Heart, label: 'תומך בפיתוח האפליקציה' },
];

export default function RemoveAdsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    packages,
    isLoading,
    isPremium: adsRemoved,
    purchasePackage,
    restorePurchases,
    isExpoGo,
  } = useRevenueCat();
  const removeAdsPackage = packages[0]; // רכישה חד-פעמית — חבילה אחת בלבד

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const [webTitle, setWebTitle] = useState('');

  const handlePurchase = async () => {
    if (!removeAdsPackage) {
      return;
    }
    setIsPurchasing(true);
    try {
      await purchasePackage(removeAdsPackage.identifier);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restorePurchases();
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLoading) {
    return (
      <Screen
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
        }}
      >
        <ActivityIndicator size="large" color={palette.primary} />
      </Screen>
    );
  }

  return (
    <Screen edges={[]} style={{ backgroundColor: '#fff' }}>
      <WebViewModal
        visible={webUrl !== null}
        url={webUrl ?? ''}
        title={webTitle}
        onClose={() => setWebUrl(null)}
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            flexDirection: rtl.flexDirection,
            justifyContent: 'flex-end',
            paddingHorizontal: 16,
            paddingTop: insets.top + 8,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#F1F3FB',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <T size={16}>✕</T>
          </Pressable>
        </View>

        {isExpoGo ? (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 8,
              padding: 10,
              borderRadius: 10,
              backgroundColor: palette.primaryTint,
            }}
          >
            <T center size={13} color={palette.primary} weight="medium">
              רכישות לא זמינות ב-Expo Go — רק ב-build אמיתי
            </T>
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 24, paddingTop: 24, gap: 6 }}>
          <T size={44} center>
            🚫📢
          </T>
          <T weight="bold" size={26} center style={{ marginTop: 8 }}>
            הסרת פרסומות
          </T>
          <T color={palette.muted} size={15} center>
            כל התוכן באפליקציה כבר פתוח לך ללא תשלום. זו רכישה חד-פעמית שרק
            מסירה פרסומות.
          </T>
        </View>

        {adsRemoved ? (
          <View
            style={{
              marginHorizontal: 24,
              marginTop: 20,
              padding: 16,
              borderRadius: 14,
              backgroundColor: palette.successBg,
              alignItems: 'center',
            }}
          >
            <T weight="bold" color={palette.success}>
              כבר רכשת — הפרסומות מוסרות ✓
            </T>
          </View>
        ) : (
          <View style={{ padding: 24, gap: 14 }}>
            {REASONS.map((r) => (
              <View
                key={r.label}
                style={{
                  flexDirection: rtl.flexDirection,
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: palette.primaryTint,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <r.icon color={palette.primary} size={18} />
                </View>
                <T style={{ flex: 1 }} size={15}>
                  {r.label}
                </T>
              </View>
            ))}
          </View>
        )}

        <View style={{ flex: 1 }} />

        {adsRemoved ? null : (
          <View style={{ paddingHorizontal: 24, gap: 16, paddingBottom: 24 }}>
            {removeAdsPackage ? (
              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: palette.primary,
                  backgroundColor: palette.primaryTint,
                  padding: 18,
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <T weight="bold" size={30} color={palette.primary}>
                  {removeAdsPackage.priceString}
                </T>
                <T color={palette.muted} size={13}>
                  תשלום חד-פעמי — לתמיד
                </T>
              </View>
            ) : null}

            <Button
              label="הסר פרסומות"
              onPress={handlePurchase}
              loading={isPurchasing}
              disabled={!removeAdsPackage}
            />

            <View
              style={{
                flexDirection: rtl.flexDirection,
                justifyContent: 'center',
                gap: 24,
              }}
            >
              <Pressable onPress={handleRestore} disabled={isRestoring}>
                {isRestoring ? (
                  <ActivityIndicator size="small" color={palette.muted} />
                ) : (
                  <T color={palette.muted} size={13}>
                    שחזור רכישה
                  </T>
                )}
              </Pressable>
              <Pressable
                onPress={() => {
                  setWebTitle('תנאי שימוש');
                  setWebUrl(TERMS_URL);
                }}
              >
                <T color={palette.muted} size={13}>
                  תנאי שימוש
                </T>
              </Pressable>
              <Pressable
                onPress={() => {
                  setWebTitle('מדיניות פרטיות');
                  setWebUrl(PRIVACY_URL);
                }}
              >
                <T color={palette.muted} size={13}>
                  פרטיות
                </T>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
