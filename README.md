# תיאוריה — Teoria App

אפליקציית iOS + Android לתרגול מבחן התאוריה של משרד התחבורה בישראל.
מאגר של 1,802 שאלות רשמיות (data.gov.il, dataset `tqhe`), מבחן מדמה, תרגול לפי נושא,
מחסן טעויות, מילון תמרורים, מעקב התקדמות והתראות תרגול.

מדריך מלא לסטטוס הפרויקט, החלטות ותוכנית עבודה: **[docs/context.md](docs/context.md)**
ו-**[docs/plan.md](docs/plan.md)** (16 שלבים מהקמה ועד פרסום בחנויות).

---

## טק סטאק

| שכבה | טכנולוגיה |
|---|---|
| Frontend | Expo (React Native) + TypeScript + Expo Router + NativeWind |
| Backend | Convex (DB + Server Functions בזמן אמת) |
| אימות | Convex Auth (אימייל/סיסמה; Google בהכנה) |
| תשלומים | RevenueCat (רכישה חד-פעמית) — טרם חובר |
| התראות | expo-notifications + Convex cron |

RTL מלא (עברית), עיצוב לפי `docs/design.md`.

---

## הרצה

```bash
bun install       # פעם ראשונה בלבד
bun dev           # מריץ את השרת + פותח QR לסריקה ב-Expo Go
```

Convex כבר מחובר (`.env.local`). אם עוברים למחשב אחר: `bunx convex dev` פעם אחת ליצירת חיבור.

---

## מבנה הפרויקט

- `app/(auth)/` — התחברות, הרשמה, paywall (טרם פעיל)
- `app/(authenticated)/` — האפליקציה עצמה: בית, מבחן/תרגול, תמרורים, מחסן טעויות, שמורות, סטטיסטיקות, היסטוריה, הגדרות, בחירת רישיון — ניווט בטאבים
- `convex/` — schema, כל פונקציות השרת, cron להתראות
- `components/ui.tsx` — ערכת קומפוננטות משותפת (Screen, Card, Button, AnswerOption, RingProgress...)
- `constants/` — פלטת צבעים (`Colors.ts`), סוגי רישיון (`licenses.ts`)
- `hooks/useQuiz.ts` — ניהול מצב מבחן/תרגול (כולל המשך מבחן שנקטע)
- `scripts/convert-questions.mjs` — מושך את מאגר השאלות מ-data.gov.il וממיר לפורמט הסכמה
- `docs/legal/` — טיוטות מדיניות פרטיות ותנאי שימוש (ממתינות לפרטי חברה + סקירת עו"ד לפני פרסום)

---

## עדכון מאגר השאלות

```bash
node scripts/convert-questions.mjs             # מייצר scripts/questions.jsonl
bunx convex import --table questions --replace --yes scripts/questions.jsonl
```
