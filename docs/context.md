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

## עדכון אחרון (session 2, המשך)

מסך מבחן/תרגול עוצב מחדש לפי Stitch. תוקן: תשובות ניתנות לשינוי במבחן מדמה, חצי ניווט RTL, סרגל טאבים Liquid Glass (expo-blur) לא חתוך. מסכי תוצאות + תרגול עוצבו. מבחן מדמה: עובר = עד 4 שגיאות. תת-נושאים חודדו (28+ נושאים). useQuiz.retry לשגיאות רשת.

## משימה נוכחית

Frontend MVP + עיצוב מלא לפי Stitch mockup של דף הבית. ניווט טאבים (בית/תרגול/תמרורים/מחסן טעויות).
פיצ'רים: ציון מוכנות (RingProgress), רצף ימים, שינוי שבועי, שאלות שמורות (bookmark), מחסן טעויות, מילון תמרורים.
נותר: (א) התחברות Google — ממתין ל-OAuth client מהמשתמש (Google Cloud). (ב) Push notifications — נדחה ל-dev build. (ג) שלב 10 RevenueCat, שלב 11 אבטחה/פרטיות, שלב 12+ חנויות.
המשתמש בודק ב-Expo Go (`bun dev`). לחיצה על `r` = reload.
קומפוננטות: components/ui.tsx. hook: hooks/useQuiz.ts.

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
