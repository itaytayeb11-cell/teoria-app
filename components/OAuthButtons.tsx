import { AntDesign } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { Button } from '@/components/ui';
import { palette } from '@/constants/Colors';

// כפתורי OAuth משותפים למסכי sign-in/sign-up. Apple חייב את הקומפוננטה
// הרשמית שלו (דרישת App Store) — לא כפתור מותאם אישית.
export function OAuthButtons(props: {
  onApple: () => void;
  onGoogle: () => void;
  appleLoading: boolean;
  googleLoading: boolean;
}) {
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  return (
    <View style={{ gap: 10 }}>
      {appleAvailable ? (
        <View>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={14}
            style={{ height: 52 }}
            onPress={props.onApple}
          />
          {props.appleLoading ? (
            <ActivityIndicator
              style={{ position: 'absolute', left: 16, top: 16 }}
              color="#fff"
            />
          ) : null}
        </View>
      ) : null}
      <Button
        label="המשך עם Google"
        variant="outline"
        loading={props.googleLoading}
        onPress={props.onGoogle}
        icon={<AntDesign color={palette.primary} name="google" size={18} />}
      />
    </View>
  );
}
