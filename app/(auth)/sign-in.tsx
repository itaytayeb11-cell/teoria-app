import { useAuthActions } from '@convex-dev/auth/react';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Button, Screen, T } from '@/components/ui';
import { WebViewModal } from '@/components/WebViewModal';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/config/legalUrls';
import { palette } from '@/constants/Colors';
import { useOAuthSignIn } from '@/hooks/useOAuthSignIn';
import { rtl } from '@/lib/rtl';

export default function SignInScreen() {
  const { signIn } = useAuthActions();
  const { signInWithProvider: signInWithGoogle, loading: googleLoading } =
    useOAuthSignIn('google');
  const { signInWithProvider: signInWithApple, loading: appleLoading } =
    useOAuthSignIn('apple');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [web, setWeb] = useState<{ url: string; title: string } | null>(null);

  const onGoogleSubmit = async () => {
    try {
      const success = await signInWithGoogle();
      if (success) {
        router.replace('/(authenticated)');
      }
    } catch {
      Alert.alert('שגיאה', 'ההתחברות עם Google נכשלה. נסה שוב');
    }
  };

  const onAppleSubmit = async () => {
    try {
      const success = await signInWithApple();
      if (success) {
        router.replace('/(authenticated)');
      }
    } catch {
      Alert.alert('שגיאה', 'ההתחברות עם Apple נכשלה. נסה שוב');
    }
  };

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert('שגיאה', 'אנא מלא את כל השדות');
      return;
    }
    setLoading(true);
    try {
      await signIn('password', { email, password, flow: 'signIn' });
      router.replace('/(authenticated)');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      Alert.alert(
        'שגיאה',
        msg.includes('InvalidSecret')
          ? 'הסיסמה שגויה'
          : msg.includes('InvalidAccountId') || msg.includes('Could not find')
            ? 'לא נמצא חשבון עם האימייל הזה'
            : 'ההתחברות נכשלה. בדוק את הפרטים ונסה שוב'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={[]} style={{ backgroundColor: 'transparent' }}>
      <LinearGradient colors={['#FFFFFF', '#87A9EE']} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'center', padding: 24 }}
        >
          <BlurView
            intensity={40}
            tint="light"
            style={[
              styles.glassCard,
              { borderRadius: 28, padding: 24, overflow: 'hidden' },
            ]}
          >
            <T weight="bold" size={30} style={{ marginBottom: 6 }}>
              התחברות
            </T>
            <T color={palette.muted} style={{ marginBottom: 28 }}>
              ברוך שובך! התחבר כדי להמשיך לתרגל.
            </T>

            <Field
              label="אימייל"
              value={email}
              onChangeText={setEmail}
              placeholder="example@gmail.com"
              keyboardType="email-address"
            />
            <Field
              label="סיסמה"
              value={password}
              onChangeText={setPassword}
              placeholder="הזן סיסמה"
              secureTextEntry
            />

            <View style={{ height: 8 }} />
            <Button label="התחבר" loading={loading} onPress={onSubmit} />

            <View
              style={{
                flexDirection: rtl.flexDirection,
                alignItems: 'center',
                gap: 10,
                marginVertical: 18,
              }}
            >
              <View
                style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }}
              />
              <T color={palette.muted} size={13}>
                או
              </T>
              <View
                style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }}
              />
            </View>

            <View style={{ gap: 10 }}>
              {Platform.OS === 'ios' ? (
                <Button
                  label="המשך עם Apple"
                  variant="outline"
                  loading={appleLoading}
                  onPress={onAppleSubmit}
                />
              ) : null}
              <Button
                label="המשך עם Google"
                variant="outline"
                loading={googleLoading}
                onPress={onGoogleSubmit}
              />
            </View>

            <View
              style={{
                flexDirection: rtl.flexDirection,
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginTop: 12,
              }}
            >
              <T size={12} color={palette.muted}>
                בהמשך עם Google/Apple אתה מאשר את{' '}
              </T>
              <Pressable
                onPress={() =>
                  setWeb({ url: TERMS_OF_SERVICE_URL, title: 'תנאי שימוש' })
                }
              >
                <T size={12} color={palette.primary}>
                  תנאי השימוש
                </T>
              </Pressable>
              <T size={12} color={palette.muted}>
                {' '}
                ו
              </T>
              <Pressable
                onPress={() =>
                  setWeb({ url: PRIVACY_POLICY_URL, title: 'מדיניות פרטיות' })
                }
              >
                <T size={12} color={palette.primary}>
                  מדיניות הפרטיות
                </T>
              </Pressable>
            </View>

            <View
              style={{
                flexDirection: rtl.flexDirection,
                justifyContent: 'center',
                gap: 6,
                marginTop: 20,
              }}
            >
              <Link href="/(auth)/sign-up" asChild>
                <Pressable>
                  <T color={palette.primary} weight="medium">
                    הירשם כאן
                  </T>
                </Pressable>
              </Link>
              <T color={palette.muted}>אין לך חשבון?</T>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </LinearGradient>

      <WebViewModal
        visible={web !== null}
        url={web?.url ?? ''}
        title={web?.title ?? ''}
        onClose={() => setWeb(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(29,78,216,0.18)',
  },
});

function Field(props: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <T weight="medium" size={14} style={{ marginBottom: 6 }}>
        {props.label}
      </T>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={props.secureTextEntry}
        keyboardType={props.keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          backgroundColor: 'rgba(255,255,255,0.7)',
          borderWidth: 1,
          borderColor: 'rgba(29,78,216,0.15)',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 14,
          fontSize: 16,
          color: '#25324D',
          textAlign: rtl.textAlign,
          writingDirection: 'rtl',
        }}
      />
    </View>
  );
}
