import { useAuthActions } from '@convex-dev/auth/react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';

// זרימת התחברות עם ספק OAuth (Google/Apple) ב-React Native: פותחים דפדפן
// פנימי לכתובת ה-OAuth שמחזיר signIn(provider), ומחכים שהוא יחזור לאפליקציה
// (דרך ה-scheme "teoria") עם קוד. את הקוד מעבירים שוב ל-signIn(provider)
// כדי להשלים את ההתחברות.
export function useOAuthSignIn(provider: 'google' | 'apple') {
  const { signIn } = useAuthActions();
  const [loading, setLoading] = useState(false);

  const signInWithProvider = async () => {
    setLoading(true);
    try {
      const redirectTo = Linking.createURL('/');
      const { redirect } = await signIn(provider, { redirectTo });
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
          await signIn(provider, { code });
          return true;
        }
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { signInWithProvider, loading };
}
