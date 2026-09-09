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
| 1. הקמת פרויקט | 🔄 | bun install ✅ · context.md ✅ · git init ✅ · commit ✅ · GitHub private ⬜ (משימת המשתמש) |
| 2. חיבור Convex | ⬜ | דורש `bunx convex dev` + אישור בדפדפן (משתמש) |
| 3. Auth Keys | ⬜ | |
| 4. Backend (schema + functions) | ⬜ | schema כרגע רק `users`. צריך `questions` + `userStats` + `convex/questions.ts` + `convex/stats.ts` |
| 5. הורדת + טביעת שאלות | ⬜ | הורדה מ-data.gov.il (משתמש) → המרה + seed (Claude) |
| 6. הרצה ראשונה | ⬜ | |
| 7. Auth Frontend | 🟡 | קיים בתבנית (sign-in/sign-up/paywall) — צריך התאמה |
| 8. Quiz Screen | ⬜ | קיימים placeholders page1/page2 |
| 9. Stats/Dashboard | ⬜ | |
| 10. Settings | 🟡 | קיים מסך בתבנית — צריך התאמה |
| 11–17 | ⬜ | Git/GitHub, RevenueCat, חנויות, build, listing, submit, launch |

## מפתחות ומשתני סביבה

| משתנה | קובץ | סטטוס |
|---|---|---|
| CONVEX_DEPLOYMENT | .env | ⬜ |
| EXPO_PUBLIC_CONVEX_URL | .env | ⬜ |
| EXPO_PUBLIC_REVENUECAT_* | .env | ⬜ (אופציונלי, שלב 12) |

## מבנה קיים (מהתבנית)

- `app/(auth)/` — sign-in, sign-up, paywall
- `app/(authenticated)/` — index, settings, page1, page2 (placeholders)
- `convex/` — schema (users בלבד), auth, users, http
- `components/` — Themed, WebViewModal, SetupScreen, PreviewModeBanner
- `contexts/RevenueCatContext.tsx`

## משימה נוכחית

סיום שלב 1 — המשתמש פותח repo private ב-GitHub ומריץ push. לאחר מכן: שלב 2 (Convex).

## בעיות פתוחות

- [ ] Convex לא מחובר (אין .env)
- [ ] schema חסר טבלאות questions + userStats
- [ ] אין שאלות ב-DB
- [ ] מסכי quiz/stats לא נבנו
