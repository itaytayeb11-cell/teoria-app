import { useAuthActions } from '@convex-dev/auth/react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';

// זרימת התחברות עם Google ב-React Native: פותחים דפדפן פנימי לכתובת ה-OAuth
// שמחזיר signIn("google"), ומחכים שהוא יחזור לאפליקציה (דרך ה-scheme "teoria")
// עם קוד. את הקוד מעבירים שוב ל-signIn("google") כדי להשלים את ההתחברות.
export function useGoogleSignIn() {
  const { signIn } = useAuthActions();
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const redirectTo = Linking.createURL('/');
      const { redirect } = await signIn('google', { redirectTo });
      if (!redirect) {
        return false;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        redirect.toString(),
        redirectTo
      );

      if (result.type === 'success' && result.url) {
        const { queryParams } = Linking.parse(result.url);
        const code = queryParams?.code;
        if (typeof code === 'string') {
          await signIn('google', { code });
          return true;
        }
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { signInWithGoogle, loading };
}
