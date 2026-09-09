// רושם את המכשיר להתראות Push פעם אחת אחרי התחברות.
import { useMutation } from 'convex/react';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { api } from '@/convex/_generated/api';
import { registerForPushNotifications } from '@/lib/notifications';

export function usePushRegistration(enabled: boolean) {
  const registerToken = useMutation(api.notifications.registerToken);
  const done = useRef(false);

  useEffect(() => {
    if (!enabled || done.current) {
      return;
    }
    done.current = true;
    (async () => {
      try {
        const token = await registerForPushNotifications();
        if (token) {
          await registerToken({ token, platform: Platform.OS });
        }
      } catch {
        // Expo Go / אין הרשאה — מתעלמים בשקט
      }
    })();
  }, [enabled, registerToken]);
}
