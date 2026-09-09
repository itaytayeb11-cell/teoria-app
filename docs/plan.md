# תוכנית עבודה — Teoria App

עודכן: 2026-09-09

## החלטות מוצר (מאושר ע"י המשתמש)

- **תשלום:** חד-פעמי ~$3.99 (Non-Consumable IAP דרך RevenueCat). אין מנוי, אין tier חינמי.
- **מאגר שאלות:** יורד מ-data.gov.il (dataset: tqhe). המשתמש מוריד קובץ רשמי, Claude ממיר + מטביע.
- **עיצוב:** המשתמש ישלח צילומי מסך/השראה. Claude בונה לפי זה. (קלט חסר — נדרש לפני שלב D)
- **קצב:** אין דדליין. איכות מעל הכל — כל שלב כולל בדיקות + סקירת אבטחה.

## עקרון עבודה

עובדים במשימות ושלבים ממוספרים. Claude רץ אוטונומית על כל מה שלא דורש את המשתמש.
כשצריך את המשתמש → חבילה מוכנה (פרומפט להעתקה + מה לשלוח בחזרה).
בסוף כל שלב → עדכון `docs/context.md` + commit.

---

## שלבים

### שלב 1 — הקמת פרויקט ✅ (הושלם 2026-09-09)
- [x] bun install
- [x] docs/context.md + docs/plan.md
- [x] git init + commit ראשון
- [ ] 👤 GitHub repo private + push  ← משימת המשתמש היחידה שנותרה

### שלב 2 — חיבור Convex (Backend + DB)
- [ ] 👤 `bunx convex dev` + אישור בדפדפן + יצירת פרויקט cloud
- [ ] 🤖 העתקת משתנים ל-.env, וידוא חיבור
- [ ] 🤖 שלב 3: Auth Keys (`bunx @convex-dev/auth` dev + prod)

### שלב 3 — Schema + Backend Functions
- [ ] 🤖 הרחבת `convex/schema.ts`: טבלאות `questions`, `quizSessions`, `userStats`, `purchases`
- [ ] 🤖 `convex/questions.ts` — שליפה, סינון לפי נושא/קושי, מבחן אקראי
- [ ] 🤖 `convex/stats.ts` — שמירת תוצאה, היסטוריה, נושא חלש
- [ ] 🤖 `convex/entitlements.ts` — בדיקת גישה בתשלום (webhook RevenueCat)
- [ ] 🤖 בדיקות: `bunx convex run` על כל function

### שלב 4 — מאגר השאלות
- [ ] 👤 הורדת הקובץ הרשמי מ-data.gov.il ושליחה ל-Claude
- [ ] 🤖 סקריפט המרה → JSON בפורמט הסכמה (טקסט, 4 תשובות, correctAnswer, category, difficulty, imageUrl?)
- [ ] 🤖 טיפול בשאלות עם תמונות תמרור (מקור תמונות + אחסון)
- [ ] 🤖 סקריפט seed ל-Convex + אימות ספירה
- [ ] 🤖 QA: בדיקת 20 שאלות אקראיות מול המקור

### שלב 5 — עיצוב ומערכת עיצוב
- [x] 👤 שליחת השראה (26 צילומים של אפליקציית "נוהג")
- [x] 🤖 מערכת עיצוב מתועדת ב-docs/design.md
- [x] 🤖 design tokens: constants/Colors.ts + tailwind.config.js
- [ ] 🤖 קומפוננטות בסיס: ScreenHeader, Button, Card, AnswerOption, ProgressBar, ConfirmModal, GuestBanner, ExplanationPanel

### שלב 6 — Frontend: Auth
- [ ] 🤖 התאמת מסכי sign-in / sign-up הקיימים לעיצוב + עברית + RTL
- [ ] 🤖 מסך פתיחה/onboarding קצר
- [ ] 🤖 בדיקה: הרשמה → התחברות → יציאה

### שלב 7 — Frontend: Quiz (הפיצ'ר המרכזי)
- [ ] 🤖 `useQuiz` hook — ניהול מצב מבחן
- [ ] 🤖 מסך שאלה: header "שאלה X מ-Y" + progress, טקסט שאלה, תמונה, 4 תשובות
- [ ] 🤖 משוב מיידי נכון/לא נכון + הסבר
- [ ] 🤖 מסך תוצאות: ציון %, טבלת שגיאות, "נסה שוב"
- [ ] 🤖 מצבי מבחן: לפי נושא / לפי קושי / מבחן מדמה (30 אקראי)
- [ ] 🤖 בדיקות: מבחן מלא מקצה לקצה

### שלב 8 — Frontend: Stats / Dashboard
- [ ] 🤖 ניקוד ממוצע (5 אחרונים), סה"כ שאלות, נושא חלש, היסטוריה
- [ ] 🤖 שמירה אמיתית ל-Convex + טעינה

### שלב 9 — Frontend: Settings
- [ ] 🤖 מצב כהה/בהיר, יציאה, מחיקת חשבון (אמיתית מול Convex)
- [ ] 🤖 קישורי Privacy Policy + Terms

### שלב 10 — תשלומים (RevenueCat)
- [ ] 👤 חשבון RevenueCat + מוצר `lifetime_access` (non-consumable) + entitlement `premium` + offering `default` + Test API Key
- [ ] 🤖 חיבור SDK, gating: משתמש בלי `premium` רואה paywall
- [ ] 🤖 webhook Convex לאימות רכישה בצד שרת
- [ ] 🤖 בדיקה עם Test Store

### שלב 11 — קשיחות: באגים, אבטחה, פרטיות
- [ ] 🤖 `/security-review` על כל ה-diff (לפני שלב 15)
- [x] 🤖 בדיקת חוקי גישה ב-Convex — כל query/mutation עם requireUserId, unregisterToken scoped
- [x] 🤖 וידוא: אין מפתחות בקוד, .env ב-gitignore
- [ ] 🤖 מיפוי מדויק של מה נאסף → App Privacy (Apple) + Data Safety (Google)
- [x] 🤖 טיוטת Privacy Policy + Terms לפי מבנה הנתונים בפועל (docs/legal/) — נותר: אירוח ב-URL ציבורי + מילוי פרטי חברה + סקירת עו"ד
- [ ] 🤖 טיפול בשגיאות: אין רשת, session פג, מבחן קטוע
- [x] 🤖 התראות Push — תשתית (expo-notifications, pushTokens, cron תזכורת יומית). מופעל רק ב-dev build
- [x] 🤖 אונבורדינג — משתמש בלי סוג רישיון מופנה לבחירה

### שלב 12 — הכנה לחנויות
- [ ] 👤 Apple Developer ($99/שנה) + Google Play Console ($25)
- [x] 🤖 app.json: שם "תיאוריה", slug teoria, ערכת כחול, expo-notifications
- [ ] 🤖 app.json: bundle id סופי, אייקון, splash (צריך אסטים גרפיים)
- [ ] 🤖 eas.json profiles
- [ ] 👤 Google OAuth client (Google Cloud) — ל-Sign in with Google
- [ ] 🤖 חיבור Google + Apple Sign-In (עובד רק ב-dev build)

### שלב 13 — Build ראשון + בדיקה במכשיר
- [ ] 🤖 `eas build` development (iOS + Android)
- [ ] 👤 התקנה בטלפון + בדיקה מלאה

### שלב 14 — Listing בחנויות
- [ ] 👤 App Store Connect + Play Console: תיאורים, מילות מפתח
- [ ] 🤖 טקסטים שיווקיים, אייקון 1024, feature graphic
- [ ] 👤 5+ צילומי מסך, חתימות בנק/מס

### שלב 15 — Submit ל-Review
- [ ] 🤖 `eas build` production + `eas submit`
- [ ] 👤 מעקב אחרי אישור

### שלב 16 — Launch 🎉
- [ ] שיווק: TikTok/Facebook, קבוצות WhatsApp, בתי ספר לנהיגה (QR)

---

## קלטים שאני מחכה להם מהמשתמש

1. פתיחת repo ב-GitHub + push (שלב 1)
2. הרצת `bunx convex dev` (שלב 2) — צריך אישור בדפדפן
3. הקובץ הרשמי של השאלות מ-data.gov.il (שלב 4)
4. צילומי מסך / השראה לעיצוב (שלב 5)
5. חשבון RevenueCat (שלב 10)
6. חשבונות Apple + Google (שלב 12)

## שאלות פתוחות למשתמש

- שם ה-bundle id? (למשל `com.itaytayeb.teoria`) — נסגור לפני שלב 12
- דומיין לאתר (ל-Privacy Policy)? אם אין — נשתמש בעמוד חינמי (GitHub Pages / Notion public)
- שפה: עברית בלבד, או גם ערבית/רוסית בהמשך?
