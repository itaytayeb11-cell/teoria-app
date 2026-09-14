import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertCircle,
  BookOpen,
  ListChecks,
  TrafficCone,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Screen, T } from '@/components/ui';
import { WebViewModal } from '@/components/WebViewModal';
import { IS_DEV_MODE, PRIVACY_URL, TERMS_URL } from '@/config/appConfig';
import { palette } from '@/constants/Colors';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { rtl } from '@/lib/rtl';

// מה שבאמת יש באפליקציה — לא תיאורים גנריים
const FEATURES: { icon: typeof BookOpen; label: string }[] = [
  { icon: BookOpen, label: 'כל מאגר השאלות הרשמי של משרד התחבורה' },
  { icon: ListChecks, label: 'מבחני מדמה + תרגול לפי נושא, ללא הגבלה' },
  { icon: TrafficCone, label: 'לוח תמרורים מלא עם חיפוש' },
  { icon: AlertCircle, label: 'מחסן טעויות אישי שעוקב אחרי מה שקשה לך' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const isPreviewMode = IS_DEV_MODE && preview === 'true';

  const { packages, isLoading, purchasePackage, restorePurchases, isExpoGo } =
    useRevenueCat();
  const lifetimePackage = packages[0]; // רכישה חד-פעמית — חבילה אחת בלבד

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const [webTitle, setWebTitle] = useState('');

  const handleContinue = async () => {
    if (isPreviewMode || !lifetimePackage) {
      return;
    }
    setIsPurchasing(true);
    try {
      const success = await purchasePackage(lifetimePackage.identifier);
      if (success) {
        router.replace('/(authenticated)');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (isPreviewMode) {
      return;
    }
    setIsRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        router.replace('/(authenticated)');
      }
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
            <X size={20} color={palette.muted} />
          </Pressable>
        </View>

        {isPreviewMode ? (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 8,
              padding: 10,
              borderRadius: 10,
              backgroundColor: '#FDEBCF',
            }}
          >
            <T center size={13} color={palette.warning} weight="medium">
              מצב תצוגה מקדימה — רכישות מושבתות
            </T>
          </View>
        ) : null}
        {isExpoGo && !isPreviewMode ? (
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
          <T weight="bold" size={26} center>
            תיאוריה — גישה מלאה
          </T>
          <T color={palette.muted} size={15} center>
            תשלום חד-פעמי. בלי מנוי, בלי חיוב חוזר.
          </T>
        </View>

        <View style={{ padding: 24, gap: 14 }}>
          {FEATURES.map((f) => (
            <View
              key={f.label}
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
                <f.icon color={palette.primary} size={18} />
              </View>
              <T style={{ flex: 1 }} size={15}>
                {f.label}
              </T>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ paddingHorizontal: 24, gap: 16, paddingBottom: 24 }}>
          {lifetimePackage ? (
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
                {lifetimePackage.priceString}
              </T>
              <T color={palette.muted} size={13}>
                תשלום חד-פעמי — לתמיד
              </T>
            </View>
          ) : null}

          <Button
            label="קבל גישה מלאה"
            onPress={handleContinue}
            loading={isPurchasing}
            disabled={isPreviewMode || !lifetimePackage}
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
      </ScrollView>
    </Screen>
  );
}
