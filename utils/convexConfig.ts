// ============================================================================
// קונפיגורציית CONVEX
// ============================================================================
// ניהול כתובת Convex

// ערכי דמה (placeholders) מתוך .env.example - נחשבים כ"לא מוגדר"
// Placeholder values from .env.example - treated as "not configured"
const PLACEHOLDER_FRAGMENTS = ['your-project-name'];

/**
 * בדיקה האם כתובת Convex מוגדרת בפועל (לא ריקה ולא ערך דמה)
 * Returns true only when a real Convex URL is configured.
 */
export function isConvexConfigured(): boolean {
  const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    return false;
  }

  // ערך הדמה מ-.env.example אינו נחשב כמוגדר
  return !PLACEHOLDER_FRAGMENTS.some((fragment) =>
    convexUrl.includes(fragment)
  );
}

/**
 * קבלת כתובת Convex
 * הכתובת נלקחת ממשתנה הסביבה EXPO_PUBLIC_CONVEX_URL
 *
 * מחזיר null אם אין כתובת מוגדרת - האפליקציה תציג מסך הגדרה ידידותי
 * במקום לקרוס. ראה app/_layout.tsx.
 * Returns null when no URL is configured so the app can show a friendly
 * setup screen instead of crashing.
 *
 * הפרדה בין Dev ל-Production מתבצעת ברמת ה-Deployment:
 * - פיתוח מקומי: `bunx convex dev` (משתמש ב-dev deployment)
 * - ייצור: `bunx convex deploy` (משתמש ב-prod deployment)
 */
export function getConvexUrl(): string | null {
  if (!isConvexConfigured()) {
    return null;
  }

  return process.env.EXPO_PUBLIC_CONVEX_URL ?? null;
}
