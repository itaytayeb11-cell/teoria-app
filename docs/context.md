# Context — Teoria App

עודכן לאחרונה: 2026-09-14 (session 3)

## מה האפליקציה עושה

אפליקציית תרגול תאוריה נהיגה בישראל (iOS + Android). **חינמית לגמרי** — כל 1,802 השאלות ממאגר משרד התחבורה וכל הפיצ'רים פתוחים לכולם. מונטיזציה: פרסומות (AdMob) בין sessions + רכישת "הסרת פרסומות" אופציונלית (לא פותחת תוכן). קהל: בני 16–24 שלומדים רישיון. פירוט מלא: docs/design.md § מודל עסקי.

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
| 6. הרצה ראשונה | ✅ | `bun dev` + Expo Go, נבדק על מכשיר לאורך כל הפרויקט |
| 7. Auth Frontend | ✅ | sign-in/sign-up + אונבורדינג (שם+רישיון+תאריך מבחן) |
| 8. Quiz Screen | ✅ | מבחן מדמה + תרגול, מחסן טעויות, שמורות, לוח תמרורים |
| 9. Stats/Dashboard | ✅ | דף בית (ווידג'טים+נושאים), מסך סטטיסטיקה, היסטוריה, טבלת דירוג, פירוט רצף |
| 10. Settings | ✅ | הוחלף בתפריט צד (drawer) — עריכת פרופיל, FAQ, צור קשר, תנאי שימוש/פרטיות, התנתק, מחיקה |
| 11. Git/GitHub | ✅ | מתמשך — כל שינוי בקומיט נפרד |
| 12. RevenueCat + AdMob | 🟡 | RevenueCat Android מוגדר במלואו (Product/Entitlement/Offering/Webhook + API key). RevenueCat iOS ממתין לחשבון Apple Developer (P8/Key ID/Issuer ID). AdMob: שתי האפליקציות + 4 יחידות פרסומת נוצרו, מזהים אמיתיים בקוד (`config/ads.ts`, `app.json`) — ממתינות לאישור חשבון חדש מגוגל (עד 24ש', לא חוסם). `ADS_ENABLED` עדיין כבוי עד שנבדוק על מכשיר אמיתי |
| 13–17 | ⬜ | חנויות (+ Apple Small Business Program בשלב 13א), build, listing, submit, launch |

## מפתחות ומשתני סביבה

| משתנה | קובץ | סטטוס |
|---|---|---|
| CONVEX_DEPLOYMENT | .env.local | ✅ (נוצר ע"י convex) |
| EXPO_PUBLIC_CONVEX_URL | .env.local **+ EAS env vars** (development/preview/production) | ✅ |
| EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY | .env.local **+ EAS env vars** | ✅ (`goog_...`) |
| EXPO_PUBLIC_REVENUECAT_IOS_API_KEY | — | ⬜ ממתין ליצירת אפליקציית iOS ב-RevenueCat (ממתין לחשבון Apple Developer) |
| REVENUECAT_WEBHOOK_SECRET | Convex dashboard env vars | ✅ הוזן ב-Convex (`npx convex env set`) — **נמצא חסר בפועל ב-2026-09-14 למרות שנשלח למשתמש קודם, תוקן** |
| EXPO_PUBLIC_SUPPORT_EMAIL | .env | ⬜ אופציונלי (אחרת placeholder ב-config/support.ts) |

⚠️ **לקח חשוב (2026-09-14):** `.env.local` הוא local בלבד — EAS build בענן לא קורא אותו (מעלה tarball דרך `git archive`, שמדלג על קבצים ב-`.gitignore`). כל `EXPO_PUBLIC_*` שהאפליקציה צריכה ב-build אמיתי (לא Expo Go) **חייב** גם `eas env:set --environment <dev/preview/production> --name ... --value ...` — אחרת ה-build עולה בהצלחה אבל האפליקציה לא מתחברת ל-Convex/RevenueCat בפועל. נמצא ותוקן אחרי שגילינו ש-`EXPO_PUBLIC_CONVEX_URL` לא היה מוגדר ב-EAS בכלל.

## מבנה נוכחי

- `app/(auth)/` — sign-in, sign-up (paywall עבר ל-authenticated/remove-ads)
- `app/(authenticated)/(tabs)/` — בית, תרגול, תמרורים, מחסן טעויות (4 הטאבים האמיתיים, Tabs נפרד)
- `app/(authenticated)/` — quiz, results, license, stats, history, settings, saved, streak, leaderboard, faq, remove-ads (כולם Stack.Screen אמיתי, לא עוד Tabs.Screen)
- `convex/` — schema (users/questions/quizSessions/answerLog/streakLog/mistakeDismissals/savedQuestions/pushTokens/purchases), quiz, stats, questions, users, mistakes, saved, purchases, notifications, crons, auth, http, model (helpers)
- `components/` — ui.tsx (ערכת קומפוננטות), HomeWidgets.tsx, AppDrawer.tsx, WebViewModal.tsx
- `contexts/RevenueCatContext.tsx`, `hooks/useQuiz.ts`, `hooks/useInterstitialAd.ts`

## עדכון אחרון (session 2, המשך)

מסך מבחן/תרגול עוצב מחדש לפי Stitch. תוקן: תשובות ניתנות לשינוי במבחן מדמה, חצי ניווט RTL, סרגל טאבים Liquid Glass (expo-blur) לא חתוך. מסכי תוצאות + תרגול עוצבו. מבחן מדמה: עובר = עד 4 שגיאות. תת-נושאים חודדו (28+ נושאים). useQuiz.retry לשגיאות רשת.

## עדכון אחרון (session 3)

**EAS build תוקן** (שני באגים נפרדים מנעו כל build): (1) רווח בסוף שם תיקיית הפרויקט גרם ל-`spawn git ENOENT` — תוקן ע"י הסרת הרווח משם התיקייה. (2) `react-native-google-mobile-ads@16.5.0` דרש Kotlin 2.3.0 שה-KSP plugin לא תומך בו — תוקן ע"י downgrade ל-`16.0.0` (Play Services Ads 24.6.0, תואם Kotlin קיים). פרויקט EAS חדש קושר לחשבון הנכון של המשתמש (`itayitayeb885/teoria`, היה מקושר בטעות לחשבון זר). Bundle ID קבוע: `com.teoria.app`.

**RTL — סבב באגים מ-real-device testing:** נמצא ותוקן bug class שלם — קוד שהניח ש-`flexDirection:'row'` הופך אוטומטית ל-row-reverse ב-RTL אבל בפועל (על המכשיר שנבדק) ההיפוך כן קורה עקבי, והבאג האמיתי היה **סדר הרכיבים ב-JSX** לא מתחשב בכך (למשל: חצי ניווט במבחן, כפתור חזרה ב-ScreenHeader, שורת הגדרות) — תוקן ב-`components/ui.tsx`, `app/(authenticated)/settings.tsx`. נקודות ההתקדמות בקרוסלת הנושאים הוסרו לגמרי לפי בקשה. נוסף פופ-אפ פנימי (לא AdMob) שמפרסם את רכישת "הסרת פרסומות" פעם ב-48 שעות (`hooks/useRemoveAdsPromo.ts`, `components/RemoveAdsPromoModal.tsx`).

**RevenueCat + AdMob הוגדרו בפועל** (ר' טבלת שלבים למעלה + מפתחות/env). **התגלה ותוקן**: `EXPO_PUBLIC_CONVEX_URL` ומפתחות אחרים לא היו מוגדרים ב-EAS env vars כלל (רק ב-`.env.local` המקומי, שלא מגיע ל-build בענן) — תוקן, ר' הערה בטבלת המפתחות למעלה. גם `REVENUECAT_WEBHOOK_SECRET` נמצא חסר בפועל ב-Convex ותוקן.

**הודעות Push** — כל הקוד קיים ומוכן (הרשמת מכשיר, cron פעמיים ביום 09:00/17:00 שעון ישראל, תזכורת רק למי שלא תרגל 2+ ימים) — עדיין לא נבדק בפועל על מכשיר אמיתי (לא עובד ב-Expo Go).

## משימה נוכחית (session 2)

עיצוב מחדש של דף הבית לפי רפרנס "פק"ל הכסף" (צבעים שונו לכחול):
- Backend: users.testDate + setTestDate/updateMyProfile, רצף (streak) עולה רק בסיום מבחן שלם (לא לכל תשובה), getHome מחזיר testDate/daysToTest/passedSimCount/failedSimCount.
- Frontend: שורת ווידג'טים בדף הבית (יהלום=רצף, טבעת-קרוסלה עם 4 מדדים שניתן להחליק/ללחוץ נקודות, טרופי=תשובות נכונות), קרוסלת נושאים אופקית שמחליפה את כרטיס המוכנות הישן, סרגל טאבים תחתון עוצב מחדש (כחול מלא, טאב פעיל מקבל "כדור" לבן — components/HomeWidgets.tsx, constants/categories.ts).
✅ עריכת פרופיל: license.tsx הורחב לשם+רישיון+תאריך מבחן (date picker), גם באונבורדינג וגם דרך הגדרות. ✅ תזכורת יומית לקביעת תאריך (מודל, פעם ביום, כל עוד אין תאריך). ✅ יהלום→מסך פירוט רצף (streakLog table חדש). ✅ טרופי→טבלת דירוג כלל-משתמשים (leaderboardScore מחושב ב-finishQuiz).
✅ צור קשר, שאלות נפוצות (2 חלקים: אפליקציה + מבחן אמיתי, מאומת מול מקורות), אתגר חברים (Share) — הכל בתפריט (components/AppDrawer.tsx, app/(authenticated)/faq.tsx).
✅ ארכיטקטורת ניווט תוקנה: 4 הטאבים עברו ל-app/(authenticated)/(tabs)/, כל שאר המסכים הם Stack.Screen אמיתי (לא עוד Tabs.Screen עם href:null) — תיקן באג "יציאה ממסך מנווטת לטאב הלא נכון".
✅ **שינוי מודל עסקי (2026-09-14):** paid-only ($3.99 חוסם תוכן) → freemium+ads. האפליקציה חינמית לגמרי, שום תוכן לא נעול. שולב `react-native-google-mobile-ads` (לא עובד ב-Expo Go — צריך dev/prod build; מזהי טסט רשמיים של גוגל בינתיים). שני פורמטים בלבד (לא rewarded video): banner קבוע בתחתית מסך המענה על שאלות בכל המצבים (תרגול/מחסן טעויות/מבחן מדמה, components/AdBanner.tsx); interstitial בשני טריגרים נפרדים (hooks/useInterstitialAd.ts) — תרגול+מחסן טעויות כל 15 תשובות שנענו, מבחן מדמה **לפני** תחילת המבחן (לא אחרי — אין interstitial אחרי מבחן/תרגול בכלל). Frequency Cap 2/30 דק' 👤 בדשבורד AdMob. שניהם לא למי שרכש הסרת פרסומות. ⚠️ **סיכון מדיניות ידוע ומאושר:** ה-interstitial לפני מבחן מדמה נוגד את מדיניות Better Ads של Google Play (עלול לגרום ל-ad serving disabled בלי אזהרה) — הוחלט ליישם במודע, פירוט מלא ב-config/ads.ts. gate התוכן הישן (`PAYMENT_SYSTEM_ENABLED && !isPremium` → redirect לpaywall) **הוסר לגמרי**. מסך paywall עבר מ-`app/(auth)/paywall` ל-`app/(authenticated)/remove-ads.tsx` (מסך רגיל בתפריט, לא גייט). RevenueCat webhook מאומת (`convex/http.ts`, `REVENUECAT_WEBHOOK_SECRET`) הוא מקור האמת היחיד לרכישות — לא client-callable. שמות עודכנו: `userHasPremium`→`userHasRemovedAds`, `getMyAccess`→`getAdStatus`, entitlement `'premium'`→`'remove_ads'`. **ממתין למשתמש:** (1) חשבון RevenueCat + מוצר `remove_ads` (non-consumable) + entitlement `remove_ads` + webhook — הוראות מדויקות נשלחו בצ'אט. (2) מזהי AdMob אמיתיים (androidAppId/iosAppId ב-app.json + יחידות פרסומת ב-config/ads.ts) לפני `ADS_ENABLED=true`.
נותר כללי: (א) התחברות Google — ממתין ל-OAuth client מהמשתמש. (ב) Push notifications — נדחה ל-dev build. (ג) חנויות (Apple/Google).
⚠️ **תזכורת קריטית לשלב 13א (App Store Connect):** להירשם ל-Apple Small Business Program (מוריד עמלה מ-30% ל-15%, לא אוטומטי, לוקח כמה שבועות, מתחדש כל שנה). Google Play — עמלה מופחתת אוטומטית, אין פעולה נדרשת.
המשתמש בודק ב-Expo Go (`bun dev`). לחיצה על `r` = reload.
קומפוננטות: components/ui.tsx, components/HomeWidgets.tsx. hook: hooks/useQuiz.ts.

## עיצוב

השראה: אפליקציית "נוהג/VocarAi" (26 צילומים מהמשתמש). כחול ראשי #1D4ED8, כרטיסים לבנים על #F4F5F7, כותרות בפאנל כחול מעוגל. פירוט מלא: docs/design.md.
MVP לא כולל: מטבעות, לידרבורד, ספר תאוריה, לוח תמרורים אנציקלופדי, מורי נהיגה, ריבוי שפות.

## הערות רשת

הרשת במחשב חוסמת את aws-e.data.gov.il ומפנה ל-Google Family Link signin — אבל data.gov.il API הרגיל עובד, וכך גם convex (עם sandbox off).

## git

remote: GitHub private `teoria-app` (חשבון itaytayeb11-cell). העלאה דרך GitHub Desktop → כפתור "Push origin".

## בעיות פתוחות

- [ ] RevenueCat iOS — צריך אפליקציית iOS ב-RevenueCat + Product `lifetime_access` מקביל בצד iOS, ממתין לחשבון Apple Developer (P8/Key ID/Issuer ID מ-App Store Connect)
- [ ] AdMob: שתי האפליקציות "נדרשת בדיקה" אצל גוגל (עד 24ש' מ-2026-09-14) — לא חוסם, אבל אין הכנסה אמיתית עד אישור. Frequency Cap (2/30 דק') עדיין לא הוגדר ידנית בדשבורד AdMob
- [ ] `ADS_ENABLED`/`PAYMENT_SYSTEM_ENABLED`/`MOCK_PAYMENTS` עדיין כבויים — להדליק אחרי שנבדק בפועל על ה-dev build
- [ ] ⚠️ סיכון מדיניות ידוע: ה-interstitial לפני מבחן מדמה נוגד Better Ads policy (ר' config/ads.ts) — לזכור כמקור אפשרי אם תהיה בעיית ad serving disabled בעתיד
- [ ] הרשמה ל-Apple Small Business Program — ממתינה לשלב 13א (App Store Connect), לא לשכוח
- [ ] כתובת מייל אמיתית ל"צור קשר" (config/support.ts עדיין placeholder)
- [ ] Convex Free plan מתקרב למגבלה — הודעה מ-Convex CLI, לבדוק בדשבורד אם צריך לשדרג
- [ ] התחברות Google — ממתין ל-OAuth client מהמשתמש
- [ ] Push notifications — קוד מוכן ופרוס (cron+רישום מכשיר), טרם נבדק בפועל על מכשיר (ממתין ל-dev build מותקן)
- [ ] Android dev build — build חדש רץ אחרי שתי סדרות תיקונים (git-path + Kotlin + AdMob App ID אמיתי + EAS env vars), ממתין לסיום
- [x] ביקורת אבטחה (2026-09-14, בעקבות בדיקת "עורך דין צד שני"): נבדקו כל ה-query/mutation ב-convex — כולם דורשים זהות מהשרת (ctx.auth), אין IDOR. `deleteMyAccount` תוקן (היה חסר streakLog/mistakeDismissals/savedQuestions/pushTokens). מדיניות הפרטיות עודכנה (קטינים במפורש, Advertising ID, כל ספק בשם)
- [ ] **ידוע ולא מתוקן במכוון**: `startQuiz`/`getResumable` שולחים ל-קליינט את כל ה-`correctAnswer` מראש (לפני שעונים) — מאפשר "רמאות עצמית" למי שבודק תעבורת רשת. לא דליפת מידע של משתמשים אחרים, רק self-cheating בתרגול. המשתמש בחר במפורש לא לתקן (ידרוש שינוי ארכיטקטורה + פגיעה במהירות המשוב)
