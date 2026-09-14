import { useConvexAuth } from 'convex/react';
import { Redirect, Slot, useLocalSearchParams } from 'expo-router';

import { IS_DEV_MODE } from '@/config/appConfig';

export default function AuthRoutesLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { preview } = useLocalSearchParams<{ preview?: string }>();

  // המתנה לטעינת סטטוס האימות
  if (isLoading) {
    return null;
  }

  // מצב תצוגה מקדימה (preview) — מאפשר למשתמש מחובר לגשת למסכי auth לדיבאג
  const isPreviewMode = IS_DEV_MODE && preview === 'true';

  // אם המשתמש כבר מחובר, הפנה אותו לאזור המאומת (אלא אם מצב preview) —
  // מונע ממשתמשים מחוברים לגשת למסכי התחברות/הרשמה בטעות
  if (isAuthenticated && !isPreviewMode) {
    return <Redirect href="/(authenticated)" />;
  }

  // שימוש ב-Slot כדי לעבד את המסכים הפנימיים (sign-in, sign-up)
  return <Slot />;
}
