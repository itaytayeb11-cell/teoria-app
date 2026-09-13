import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Card, Screen, ScreenHeader, T } from '@/components/ui';
import { WebViewModal } from '@/components/WebViewModal';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/config/legalUrls';
import { palette } from '@/constants/Colors';
import { licenseLabel } from '@/constants/licenses';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.getCurrentUser);
  const deleteMyAccount = useMutation(api.users.deleteMyAccount);
  const [webUrl, setWebUrl] = useState<string | null>(null);

  const confirmSignOut = () => {
    Alert.alert('התנתקות', 'להתנתק מהחשבון?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'התנתק', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(
      'מחיקת חשבון',
      'פעולה זו תמחק לצמיתות את החשבון וכל הנתונים (מבחנים, היסטוריה, התקדמות). לא ניתן לשחזר.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק חשבון',
          style: 'destructive',
          onPress: () => {
            Alert.alert('אישור סופי', 'למחוק את החשבון לצמיתות?', [
              { text: 'ביטול', style: 'cancel' },
              {
                text: 'כן, מחק',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await deleteMyAccount();
                    await signOut();
                  } catch {
                    Alert.alert('שגיאה', 'מחיקת החשבון נכשלה. נסה שוב.');
                  }
                },
              },
            ]);
          },
        },
      ]
    );
  };

  const name = user?.fullName || user?.email?.split('@')[0] || 'תלמיד';

  return (
    <Screen edges={[]}>
      <ScreenHeader title="שלום" highlight={name} backLabel="בית" />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 10 }}
      >
        <Row
          label={`עריכת פרופיל (${licenseLabel(user?.licenseType ?? undefined)})`}
          onPress={() => router.push('/(authenticated)/license')}
        />
        <Row
          label="תנאי שימוש"
          onPress={() => setWebUrl(TERMS_OF_SERVICE_URL)}
        />
        <Row
          label="מדיניות פרטיות"
          onPress={() => setWebUrl(PRIVACY_POLICY_URL)}
        />
        <Row label="התנתק" onPress={confirmSignOut} danger />
        <View style={{ height: 24 }} />
        <Row label="מחיקת חשבון" onPress={confirmDelete} danger />
      </ScrollView>

      <WebViewModal
        visible={webUrl !== null}
        url={webUrl ?? ''}
        onClose={() => setWebUrl(null)}
        title="מסמך"
      />
    </Screen>
  );
}

function Row(props: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Card
      onPress={props.onPress}
      style={{
        flexDirection: rtl.flexDirection,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <ChevronLeft color="#C7CBD4" size={20} />
      <T
        weight="medium"
        color={props.danger ? palette.danger : undefined}
        style={{ flex: 1, marginHorizontal: 12 }}
      >
        {props.label}
      </T>
    </Card>
  );
}
