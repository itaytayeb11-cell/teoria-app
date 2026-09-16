import Apple from '@auth/core/providers/apple';
import Google from '@auth/core/providers/google';
import { Password } from '@convex-dev/auth/providers/Password';
import { convexAuth } from '@convex-dev/auth/server';

// הגדרת מערכת האימות (Authentication)
// קובץ זה מגדיר את ספקי ההזדהות והלוגיקה של יצירת משתמשים
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  // Apple חובה (לא רק נחמד) — Guideline 4.8 של אפל: אפליקציה עם כניסה
  // חברתית (Google וכו') חייבת גם Sign in with Apple כאופציה שווה-ערך
  providers: [Password, Google, Apple],
  session: {
    totalDurationMs: 30 * 24 * 60 * 60 * 1000, // משך זמן ה-Session (30 ימים)
  },
  callbacks: {
    // פונקציה שנקראת בעת יצירה או עדכון של משתמש
    async createOrUpdateUser(ctx, args) {
      const now = Date.now();
      // מסך ההרשמה לא אוסף שם — args.profile.name תמיד undefined כרגע.
      // חשוב: לא לכתוב ברירת מחדל קבועה ('User') לתוך fullName, כי אז
      // ההתחברות הבאה הייתה "מנעלת" אותה קבוע על כל משתמש, וזה גם דורס
      // fallback יפה יותר במסכים (אימייל / "תלמיד") שסומך על fullName
      // ריק כשאין שם אמיתי.
      const name = args.profile.name || undefined;

      // אם המשתמש כבר קיים (התחברות נוספת) — מעדכנים רק מה שבאמת יכול
      // להשתנות מהספק (אימייל/אימות), ולא דורסים שם קיים בלי שם חדש אמיתי
      if (args.existingUserId) {
        await ctx.db.patch(args.existingUserId, {
          email: args.profile.email,
          emailVerified: args.profile.emailVerified ?? false,
          ...(name ? { fullName: name } : {}),
          updatedAt: now,
        });
        return args.existingUserId;
      }

      // יצירת משתמש חדש עם כל השדות הנדרשים לפי ה-Schema
      return await ctx.db.insert('users', {
        email: args.profile.email ?? '',
        emailVerified: args.profile.emailVerified ?? false,
        fullName: name,
        role: 'user', // תפקיד ברירת מחדל
        isActive: true, // משתמש פעיל כברירת מחדל
        createdAt: now,
        updatedAt: now,
      });
    },
  },
});
