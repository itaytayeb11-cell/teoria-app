import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { Calendar, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  Screen,
  ScreenHeader,
  T,
  TextField,
} from '@/components/ui';
import { palette } from '@/constants/Colors';
import { DEFAULT_LICENSE, LICENSE_OPTIONS } from '@/constants/licenses';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

// מסך "השלמת פרופיל" — נפתח פעם אחת בכניסה הראשונה (שם + רישיון + תאריך
// מבחן), ונגיש שוב מאוחר יותר מהגדרות לעריכה חוזרת
export default function LicenseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useQuery(api.users.getCurrentUser);
  const setLicense = useMutation(api.users.setLicenseType);
  const updateProfile = useMutation(api.users.updateMyProfile);
  const setTestDateMutation = useMutation(api.users.setTestDate);

  const [name, setName] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [testDate, setTestDate] = useState<Date | null | undefined>(undefined);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // עד שהמשתמש עצמו עורך שדה — משתמשים בערך שכבר שמור בשרת
  const currentName = name ?? user?.fullName ?? '';
  const currentLicense = selected ?? user?.licenseType ?? DEFAULT_LICENSE;
  const currentTestDate =
    testDate !== undefined
      ? testDate
      : user?.testDate
        ? new Date(user.testDate)
        : null;

  const isOnboarding = !user?.licenseType || !user?.fullName;

  const save = async () => {
    if (!currentName.trim()) {
      Alert.alert('חסר שם', 'איך קוראים לך?');
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        updateProfile({ fullName: currentName.trim() }),
        setLicense({ licenseType: currentLicense }),
        setTestDateMutation({
          testDate: currentTestDate ? currentTestDate.getTime() : null,
        }),
      ]);
      if (isOnboarding || !router.canGoBack()) {
        router.replace('/(authenticated)');
      } else {
        router.back();
      }
    } catch {
      Alert.alert(
        'שגיאה',
        'לא הצלחנו לשמור. בדוק את החיבור לאינטרנט ונסה שוב.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={[]}>
      <ScreenHeader title="השלמת" highlight="פרופיל" hideBack={isOnboarding} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <TextField
          label="שם מלא"
          value={currentName}
          onChangeText={setName}
          placeholder="איך קוראים לך?"
        />

        <View style={{ gap: 10 }}>
          <T weight="bold" size={15}>
            סוג הרישיון שמתאמנים עליו
          </T>
          {LICENSE_OPTIONS.map((opt) => {
            const on = currentLicense === opt.marker;
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
        </View>

        <View style={{ gap: 10 }}>
          <T weight="bold" size={15}>
            מתי מבחן התאוריה שלך?
          </T>
          <Card
            onPress={() => setShowPicker(true)}
            style={{
              flexDirection: rtl.flexDirection,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                flexDirection: rtl.flexDirection,
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Calendar color={palette.primary} size={20} />
              <T weight="medium" size={15}>
                {currentTestDate
                  ? currentTestDate.toLocaleDateString('he-IL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'עדיין לא נקבע'}
              </T>
            </View>
            {currentTestDate ? (
              <Pressable hitSlop={10} onPress={() => setTestDate(null)}>
                <X color={palette.muted} size={18} />
              </Pressable>
            ) : null}
          </Card>
          <T color={palette.muted} size={12}>
            אין לך תאריך עדיין? אפשר להמשיך בלי, ולהוסיף בכל שלב מההגדרות.
          </T>
        </View>

        {showPicker ? (
          <View>
            <DateTimePicker
              value={currentTestDate ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(event, date) => {
                if (Platform.OS === 'android') {
                  setShowPicker(false);
                }
                if (event.type !== 'dismissed' && date) {
                  setTestDate(date);
                }
              }}
            />
            {Platform.OS === 'ios' ? (
              <Button
                label="סיום"
                variant="outline"
                onPress={() => setShowPicker(false)}
              />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
      <View style={{ padding: 16, paddingBottom: Math.max(insets.bottom, 16) }}>
        <Button label="שמור והמשך" loading={saving} onPress={save} />
      </View>
    </Screen>
  );
}
