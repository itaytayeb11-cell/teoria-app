import { useAuthActions } from '@convex-dev/auth/react';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { Button, Screen, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { rtl } from '@/lib/rtl';

export default function SignInScreen() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', padding: 24 }}
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
      </KeyboardAvoidingView>
    </Screen>
  );
}

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
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: '#E5E7EB',
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
