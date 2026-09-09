# Context — Teoria App

עודכן לאחרונה: 2026-09-09

## מה האפליקציה עושה

אפליקציית תרגול תאוריה נהיגה בישראל (iOS + Android). אפליקציה בתשלום (~$3.99), 1,200+ שאלות ממאגר משרד התחבורה. קהל: בני 16–24 שלומדים רישיון.

## סטאק

Expo (SDK 54 / expo-router 6) · React Native 0.81 · TypeScript · Convex · Convex Auth · RevenueCat · NativeWind

## סטטוס שלבים

| שלב | סטטוס | הערות |
|---|---|---|
| 0. התקנות במחשב | ✅ | bun 1.3.14, node v24.16, git 2.50 |
| 1. הקמת פרויקט | ✅ | bun install ✅ · context.md ✅ · git init ✅ · commit ✅ · GitHub private (teoria-app) ✅ 2026-09-09 |
| 2. חיבור Convex | ✅ | `bun run setup` הורץ 2026-09-09, deployment cloud פעיל |
| 3. Auth Keys | ✅ | Password provider, מפתחות נוצרו |
| 4. Backend (schema + functions) | ✅ | schema: questions, quizSessions, answerLog, purchases. functions: questions/quiz/stats/purchases + model.ts helpers. deployed, typecheck+lint נקי |
| 5. הורדת + טביעת שאלות | ✅ | 1,802 שאלות מ-data.gov.il API (CKAN datastore) → scripts/convert-questions.mjs → questions.jsonl → convex import. נושאים: חוקי התנועה 901, בטיחות 400, תמרורים 391, הכרת הרכב 110. 598 עם תמונה (imageUrl מ-gov.il) |
| 6. הרצה ראשונה | ⬜ | |
| 7. Auth Frontend | 🟡 | קיים בתבנית (sign-in/sign-up/paywall) — צריך התאמה |
| 8. Quiz Screen | ⬜ | קיימים placeholders page1/page2 |
| 9. Stats/Dashboard | ⬜ | |
| 10. Settings | 🟡 | קיים מסך בתבנית — צריך התאמה |
| 11–17 | ⬜ | Git/GitHub, RevenueCat, חנויות, build, listing, submit, launch |

## מפתחות ומשתני סביבה

| משתנה | קובץ | סטטוס |
|---|---|---|
| CONVEX_DEPLOYMENT | .env.local | ✅ (נוצר ע"י convex) |
| EXPO_PUBLIC_CONVEX_URL | .env.local | ✅ |
| EXPO_PUBLIC_REVENUECAT_* | .env | ⬜ (אופציונלי, שלב 12) |

## מבנה קיים (מהתבנית)

- `app/(auth)/` — sign-in, sign-up, paywall
- `app/(authenticated)/` — index, settings, page1, page2 (placeholders)
- `convex/` — schema (users בלבד), auth, users, http
- `components/` — Themed, WebViewModal, SetupScreen, PreviewModeBanner
- `contexts/RevenueCatContext.tsx`

## משימה נוכחית

שלבים 6-9 הושלמו — Frontend MVP בנוי (auth, בית, license, תרגול, מבחן, תוצאות, סטטיסטיקות, היסטוריה, הגדרות). typecheck+lint נקי.
הבא: המשתמש מריץ `bun dev` + Expo Go בטלפון לבדיקה ראשונה. אחר כך: שלב 10 (RevenueCat), 11 (אבטחה/פרטיות).
קומפוננטות ב-components/ui.tsx, hook ב-hooks/useQuiz.ts. ניווט Stack ב-(authenticated).

## עיצוב

השראה: אפליקציית "נוהג/VocarAi" (26 צילומים מהמשתמש). כחול ראשי #1D4ED8, כרטיסים לבנים על #F4F5F7, כותרות בפאנל כחול מעוגל. פירוט מלא: docs/design.md.
MVP לא כולל: מטבעות, לידרבורד, ספר תאוריה, לוח תמרורים אנציקלופדי, מורי נהיגה, ריבוי שפות.

## הערות רשת

הרשת במחשב חוסמת את aws-e.data.gov.il ומפנה ל-Google Family Link signin — אבל data.gov.il API הרגיל עובד, וכך גם convex (עם sandbox off).

## git

remote: GitHub private `teoria-app` (חשבון itaytayeb11-cell). העלאה דרך GitHub Desktop → כפתור "Push origin".

## בעיות פתוחות

- [ ] Convex לא מחובר (אין .env)
- [ ] schema חסר טבלאות questions + userStats
- [ ] אין שאלות ב-DB
- [ ] מסכי quiz/stats לא נבנו
