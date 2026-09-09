import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Screen, ScreenHeader, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { DEFAULT_LICENSE, LICENSE_OPTIONS } from '@/constants/licenses';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

export default function LicenseScreen() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const setLicense = useMutation(api.users.setLicenseType);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const current = selected ?? user?.licenseType ?? DEFAULT_LICENSE;

  const save = async () => {
    setSaving(true);
    try {
      await setLicense({ licenseType: current });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="בחר" highlight="רישיון" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {LICENSE_OPTIONS.map((opt) => {
          const on = current === opt.marker;
          return (
            <Card
              key={opt.marker}
              onPress={() => setSelected(opt.marker)}
              style={{
                flexDirection: rtl.flexDirection,
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1.5,
                borderColor: on ? palette.primary : 'transparent',
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 2,
                  borderColor: on ? palette.primary : '#C7CBD4',
                  backgroundColor: on ? palette.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {on && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#fff',
                    }}
                  />
                )}
              </View>
              <T weight="medium" size={17}>
                {opt.label} ({opt.code})
              </T>
            </Card>
          );
        })}
      </ScrollView>
      <View style={{ padding: 16 }}>
        <Button label="שמור והמשך" loading={saving} onPress={save} />
      </View>
    </Screen>
  );
}
