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
- [x] ✅ **Convex Free plan — נמצא ותוקן הגורם האמיתי (2026-09-15)**. **התיאוריה הראשונית שלי הייתה שגויה** (חשבתי שזו מגבלת מספר-פרויקטים ברמת החשבון) — המשתמש בדק בפועל בדשבורד Convex (עם Claude-in-Chrome) ומצא: `stats.getHome` נקראה 1,200 פעם בחודש וצרכה 793.51MB (~660KB לקריאה) — בדיוק תואם סריקה מלאה של טבלת `questions` (1,802 מסמכים שלמים: טקסט+4 תשובות+הסבר) בכל טעינת מסך בית. תוקן: נוספה טבלת קאש `questionBankStats` (גודל מאגר + פילוח נושאים, לפי סוג רישיון), מחושבת ב-`questions.recomputeBankStats` (חד-פעמי אחרי כל ייבוא שאלות, לא בכל טעינה). `stats.getHome` ו-`questions.listCategories` קוראות מהקאש במקום לסרוק. **עודכן שוב (2026-09-15, אחרי ביקורת נוספת בדשבורד ע"י Claude-in-Chrome שאימתה את התיקון וזיהתה שאין cron/רענון אוטומטי)**: `recomputeBankStats` רץ עכשיו **אוטומטית בסוף `importQuestions`** (לא cron תקופתי — היה מנוגד למטרה של הפחתת שימוש) — לא צריך יותר להריץ ידנית. `getBankStats` גם כולל fallback ל-`"all"` אם licenseKey ספציפי חסר בקאש. שלושת הנקודות אומתו מול הקוד בפועל.
- ✅ **התחברות Google — הושלם במלואו (2026-09-15)**: `convex/auth.ts` מוסיף Google provider, `hooks/useGoogleSignIn.ts` מיישם את זרימת ה-OAuth ל-React Native (expo-web-browser + `teoria://` scheme), כפתור "המשך עם Google" במסך ההתחברות. המשתמש יצר פרויקט Google Cloud נפרד ("Teoria App", לא ערבב עם פרויקט אחר קיים שלו) + OAuth consent screen (External) + OAuth Client ID עם ה-redirect URI הנכון. `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` הוגדרו ב-Convex env בפועל (`bunx convex env set`), `bunx convex dev --once` רץ בהצלחה. **טרם נבדק שהזרימה עובדת בפועל בסימולטור/מכשיר** (ידרוש login עם משתמש גוגל אמיתי).
- [ ] Push notifications — קוד מוכן ופרוס (cron+רישום מכשיר), טרם נבדק בפועל על מכשיר (ממתין ל-dev build מותקן)
- [ ] Android dev build — **הסתיים בהצלחה** (2026-09-14 21:37, build 65a02558). APK: https://expo.dev/artifacts/eas/NIEVUbhTSIq2jQPq26t6nfoV2R1H8_JIbJxfiJ0DXlo.apk — ממתין שהמשתמש יתקין ויבדוק על מכשיר אמיתי (Convex, מבחנים, RevenueCat, ואז ads+push)
- [x] ביקורת אבטחה (2026-09-14, בעקבות בדיקת "עורך דין צד שני"): נבדקו כל ה-query/mutation ב-convex — כולם דורשים זהות מהשרת (ctx.auth), אין IDOR. `deleteMyAccount` תוקן (היה חסר streakLog/mistakeDismissals/savedQuestions/pushTokens). מדיניות הפרטיות עודכנה (קטינים במפורש, Advertising ID, כל ספק בשם)
- [ ] **ידוע ולא מתוקן במכוון**: `startQuiz`/`getResumable` שולחים ל-קליינט את כל ה-`correctAnswer` מראש (לפני שעונים) — מאפשר "רמאות עצמית" למי שבודק תעבורת רשת. לא דליפת מידע של משתמשים אחרים, רק self-cheating בתרגול. המשתמש בחר במפורש לא לתקן (ידרוש שינוי ארכיטקטורה + פגיעה במהירות המשוב)

## עדכון (session 4, 2026-09-15) — התקדמות עצמאית לקראת iOS

המשתמש בחר להתמקד קודם ב-App Store (לא Google Play), ולתת לי להתקדם לבד בכל מה שלא דורש אותו:

- ✅ אומת: Android dev build (65a02558) **הסתיים בהצלחה** ב-2026-09-14 21:37.
- ✅ lint + typecheck נקיים (`bun run lint:full`).
- ✅ הופעל **iOS simulator build** (`development-simulator` profile, לא דורש חשבון Apple Developer בתשלום כי אין code signing לסימולטור) — build `051be844-42e4-43a1-8a0e-66a1627fc32c`, רץ ברקע.
- 🔴 **נמצאה ותוקנה בעיית תוכן משפטי**: `docs/legal/privacy.md` הצהיר "איננו משתמשים ברשתות פרסום... של צד שלישי" — הצהרה **שקרית בפועל**, כי `react-native-google-mobile-ads` (AdMob) כן מותקן ופעיל (banner+interstitial). תוקן: נוסף סעיף Advertising ID + שורת AdMob בטבלת הספקים. גם `docs/legal/terms.md` סעיף 4 תואר מודל עסקי ישן (רכישה חוסמת תוכן) — תוקן לתאר freemium+ads+הסרת פרסומות בהתאם למודל הנוכחי.
- ✅ **תוקן**: `config/legalUrls.ts` + `config/support.ts` עודכנו — לא עוד placeholder. נבנה עמוד HTML עצמאי (מדיניות פרטיות + תנאי שימוש + הצהרת נגישות, RTL, עם טאבים) מתוך תוכן artifact קיים שהיה כבר כתוב היטב אך **התברר שדרש התחברות ל-Claude** (בדק המשתמש בחלון פרטי — לא נטען) ולכן לא היה שימושי כ-URL פומבי. הועלה לענף `gh-pages` נפרד בריפו (`git push origin gh-pages`, קומיט `243f5b8`). `SUPPORT_EMAIL` עודכן ל-`itaytayeb11@gmail.com`.
- ✅ **בוצע (2026-09-15)**: הריפו הפך ל-Public, GitHub Pages הופעל (source: `gh-pages` / root). העמוד **חי בפועל**: `https://itaytayeb11-cell.github.io/teoria-app/` (מאומת עם curl — 200 OK). מדיניות הפרטיות ותנאי השימוש באפליקציה עובדים באמת עכשיו, לא עוד placeholder.
- ✅ נוצרה טיוטת App Store listing מלאה — `docs/app-store-listing.md` (שם, תיאור, מילות מפתח, Age Rating, App Privacy טיוטה).
- ✅ **אומת בפועל על iOS Simulator** (iPhone 17 Pro Max, iOS 26.5): הותקן ה-development-simulator build, הורץ `bun dev`, ונפתח מסך ההתחברות בהצלחה — מאמת חיבור תקין ל-Convex על iOS (לא רק Android). נדרשה הרשאת macOS Accessibility כדי לשלוט בסימולטור מהטרמינל/Cursor — ניתנה בפועל ל-Cursor אך עדיין נכשלת (TCC כנראה קשור לבינארי מדויק, לא לבאנדל) — **המשך צילומי מסך (מסכי בית/מבחן/תוצאות שדורשים login + ניווט) נדחה** לשלב קרוב יותר ל-submit בפועל, כי ממילא חסום עד אקטיבציית Apple. אם רוצים להמשיך בלי לפתור את הרשאת ה-Accessibility — אפשר בשיטת "משתמש לוחץ, אני מצלם עם `xcrun simctl io ... screenshot`" (עבד טוב).
- 👤 **טרם אושר**: שם "מפעיל האפליקציה" (הוצע "איתי טייב", כבר בעמוד ה-HTML) ועיר לסמכות שיפוט בתנאי השימוש — עדיין `[שם]`/`[עיר]` ב-`docs/legal/terms.md`.

## עדכון (session 4 המשך, 2026-09-15) — Apple Developer account פעיל, SBP חסום זמנית

- ✅ **חשבון Apple Developer אומת כפעיל** — נכנס ל-App Store Connect בהצלחה (`itay tayeb`).
- 🔴 **Small Business Program עדיין לא נגיש** — נבדק (ע"י Claude-in-Chrome עם גישה לדפדפן של המשתמש, בהרשאתו): הוא לא מופיע בשום תפריט. הסיבה שאותרה: **Paid Apps Agreement** עדיין בסטטוס "New" (לא נחתם), וכדי לחתום צריך קודם למלא **Legal Entity** (פרטי ישות משפטית) + פרטי מס ובנק ב-App Store Connect → Business. ה-SBP כנראה ייפתח רק אחרי זה. Free Apps Agreement כן פעיל.
- 👤 **צעד הבא (חובה, המשתמש בעצמו — לא AI)**: למלא Legal Entity + לחתום Paid Apps Agreement + להזין פרטי בנק/מס תחת App Store Connect → Business → Edit Legal Entity. **הומלץ למשתמש לא להעביר את זה ל-AI** כי זה כולל ת.ז/מספר מס וחשבון בנק. זה גם תנאי סף נדרש בכל מקרה לפני IAP (RevenueCat iOS), אז לא סטייה מהתוכנית.
- תועד גם ב-Notion (דף פרטי "Teoria App - Dev Accounts", נוצר ע"י Claude-in-Google/Chrome של המשתמש).

## עדכון (session 4 המשך, 2026-09-15) — Paid Apps Agreement Active, SBP הוגש

- ✅ **הבנק אושר, Paid Apps Agreement עבר ל-Active.**
- ✅ **Small Business Program הוגש בהצלחה.** נמצא בפועל ב-`developer.apple.com/app-store/small-business-program` (לא בתוך App Store Connect עצמו). Team ID: `RGFW68X3V2`. תשובות המשתמש לשאלון Associated Developer Accounts: No לכל 4 השאלות (אין בעלות/שליטה הדדית עם חשבונות Apple Developer אחרים). התקבל אישור הגשה, אפל תעדכן במייל. **תזכורת שנתית לחידוש נקבעה ל-16.9.2027.**
- ✅ **עזיבת team זר** — התגלה team נוסף בשם "itamar marciano" (שותף עסקי לשעבר, תפקיד Customer Support בלבד) שהיה מחובר לחשבון Apple של המשתמש. המשתמש עזב את ה-team הזה לגמרי (Leave Team) — כרגע רק "itay tayeb" team קיים. **המשתמש יצטרך להתחבר מחדש ל-Apple ID בדפדפן** (ההתנתקות הכריחה session חדש).
- ✅ **App Store Connect API Key + Bundle ID נוצרו (2026-09-15)**. Key ID: `J2ATC693QR`, Issuer ID: `46bf9b16-80cb-442c-aef5-f39d44a4f41d`, Team ID: `RGFW68X3V2`. קובץ ה-P8 (הסוד היחיד כאן — כל השאר מזהים, לא סודות) הועבר ל-`secrets/AuthKey_J2ATC693QR.p8` (בתיקייה שכבר ב-`.gitignore`). Bundle ID `com.teoria.app` נרשם תחת App IDs עם Push Notifications + In-App Purchase. `eas.json` → `submit.production.ios` עודכן עם כל המזהים (לא הקובץ עצמו).
- ✅ **RevenueCat iOS + App Store Connect app — הושלם (2026-09-16)**. נוצרה אפליקציית "תיאוריה" ב-App Store Connect (iOS, com.teoria.app). נוצר IAP `remove_ads` (Non-consumable, ₪19.90, כל המדינות). נוצר מפתח **In-App Purchase Key נפרד** (לא אותו App Store Connect API Key הכללי!) — `teoria-iap`, Key ID `MZ3S97AYFD`, קובץ `secrets/SubscriptionKey_MZ3S97AYFD.p8`. ב-RevenueCat: אפליקציית iOS נוספה, אומתה מול אפל ("Valid credentials"), Product `remove_ads` נוצר וקושר ל-Entitlement `remove_ads` הקיים ול-Offering `default`. **Public API Key iOS**: `appl_kXRoZwnNUuBZcZfjJqojFKkfdDU` — הוגדר ב-`.env.local` **וגם** ב-EAS env vars לשלוש הסביבות (development/preview/production).
- ✅ **Build רשמי ל-iOS הסתיים בהצלחה (2026-09-16, 16:00)** — המשתמש הריץ בעצמו בטרמינל האמיתי שלו (לא דרך Claude, כי דרש Apple ID+2FA). נוצרו אוטומטית: Distribution Certificate, Provisioning Profile, Apple Push Notifications key. Build #5, ID `ffdac6e5-05eb-4002-8e63-985c4e891eb7`. חשוב לזכור: **build:configure/build הראשוני חייב לרוץ בטרמינל אמיתי של המשתמש** — נכשל דרך הכלים של Claude כי אין שם TTY אמיתי לפרומפטים אינטראקטיביים (`Distribution Certificate is not validated for non-interactive builds`). קובץ ה-IPA מוכן: `https://expo.dev/artifacts/eas/rlWyns66Bn2monx0s31IwNVZ1sN539x7lr5ZbDbo86E.ipa`
- ✅ **הועלה ל-App Store Connect / TestFlight (2026-09-16, 16:xx)**. מצאתי את ה-`ascAppId` (App ID `6812739897`) בעצמי דרך קריאה ישירה ל-App Store Connect API (JWT חתום עם ה-P8 שכבר יש לנו) — לא דרש עוד סבב עם Claude-in-Chrome. `eas submit --platform ios --profile production` רץ בהצלחה **דרך הכלים של Claude** (לא הטרמינל של המשתמש — כי submit משתמש ב-API Key, לא בסיסמת Apple, אז לא דרש TTY אינטראקטיבי). Submission ID: `a00851dc-f6e8-4b99-abbf-ffa04dd33bfa`. אפל מעבדת (5-10 דק'), תישלח הודעת מייל. מעקב: https://appstoreconnect.apple.com/apps/6812739897/testflight/ios
- ✅ **דף החנות מולא ישירות דרך App Store Connect API (2026-09-16)** — לא דרך דפדפן/Claude-in-Chrome בכלל. השתמשתי ב-App Store Connect API Key (App Manager, `teoria-eas`) לבנות JWT (ES256) ולקרוא ל-API ישירות מהטרמינל שלי. מולא: subtitle ("1,800+ שאלות רשמיות"), description מלא, keywords, promotional text, support URL, primary category (Education), ה-build (#5) קושר לגרסה 1.0, **ואת כל שאלון ה-Age Rating** (advertising=true, שאר קטגוריות התוכן=NONE/false בהתאם לתוכן בפועל, ageAssurance=false). **הערות טכניות שגיליתי בדרך (התוקנו לפי הודעות שגיאה מדויקות מה-API, לא ניחוש)**: אימוג'ים (🚗, ✓) לא מותרים ב-description; keywords מוגבל ל-100 תווים לעברית; שדות ה-Age Rating חלק Boolean וחלק String enum ("NONE"/"INFREQUENT_OR_MILD"/"FREQUENT_OR_INTENSE") — לא אחיד לפי שם השדה, צריך לבדוק כל אחד.
- ✅ **מחיר האפליקציה מאומת (2026-09-16)** — בדקתי `appPriceSchedule` דרך ה-API, אין מחיר ידני מוגדר = חינם כברירת מחדל, בדיוק כמו שרצינו. לא צריך פעולה.
- 🔴 **נמצא ותוקן סיכון דחייה אמיתי מאפל (2026-09-16), תוך כדי הכנת שאלון App Privacy**: לא הייתה שום טיפול ב-**App Tracking Transparency (ATT)** — AdMob דורש כברירת מחדל מזהה פרסום (IDFA) לפרסומות מותאמות אישית, ומ-iOS 14.5 אפל **מחייבת** בקשת הרשאה מהמשתמש לפני זה (Guideline 5.1.2), אחרת דחייה כמעט וודאית ב-review. **המשתמש בחר לממש ATT אמיתי** (לא לעבור לפרסומות לא-מותאמות). יושם: `expo-tracking-transparency` (מותקן), `hooks/useTrackingPermission.ts` (מבקש הרשאה פעם אחת per install, ב-`app/(authenticated)/_layout.tsx` לצד `usePushRegistration`), `NSUserTrackingUsageDescription` מוגדר בשני מקומות ב-`app.json` (גם plugin של `react-native-google-mobile-ads` וגם של `expo-tracking-transparency`, לוודא שאין ברירת מחדל גנרית שדורסת את הטקסט שלנו). **⚠️ חשוב: ה-build שכבר הועלה ל-TestFlight (build #5) לא כולל את התיקון הזה — צריך build חדש לפני שליחה סופית ל-review.**
- ✅ **App Privacy nutrition label מולא (2026-09-16)** דרך Claude-in-Chrome, לפי הנחיה מדויקת: Name/Email/Other User Content/Purchase History = App Functionality + Linked, Device ID = Third-Party Advertising + Tracking (בגלל AdMob+ATT). שאר הקטגוריות (Health/Financial/Location/וכו') = לא נאסף. **ממתין לאישור המשתמש ל-Publish הסופי** (הוא ביקש לראות סיכום לפני פרסום — הסיכום אושר, ממתין שילחץ בפועל).
- 🔴 **נמצא ותוקן עוד סיכון דחייה אמיתי (2026-09-16)**: **Sign in with Apple היה חסר לגמרי** — Guideline 4.8 של אפל מחייבת אותו כל עוד יש כניסה חברתית אחרת (הוספנו Google Sign-In קודם). יושם: `expo-apple-authentication`, `convex/auth.ts` (Apple provider), `hooks/useOAuthSignIn.ts` (הוכלל מ-`useGoogleSignIn` הישן ל-hook גנרי לשני הספקים), כפתור "המשך עם Apple" (iOS בלבד) במסך ההתחברות. **תהליך יצירת המפתח באפל דרש 2 תיקונים תוך כדי** (לא ניחוש — עצרנו ותוקן לפי מסכים בפועל): (1) חובה להפעיל את capability "Sign In with Apple" קודם על ה-App ID הראשי (com.teoria.app) לפני שאפשר לקשר אותו ל-Services ID; (2) שם מפתח לא יכול להכיל מקפים. Services ID: `com.teoria.app.signin`. Key ID: `F6Q35ZYD67`. Client Secret (JWT) נוצר ונחתם עצמאית (סקריפט זמני עם אותו קוד ES256 signing כמו App Store Connect API), הוגדר ב-Convex כ-`AUTH_APPLE_ID`/`AUTH_APPLE_SECRET`. **⚠️ ה-JWT הזה פג תוקף ב-18.3.2027 (מקסימום 6 חודשים לפי אפל) — צריך תזכורת ליצור חדש לפני אז, אחרת Sign in with Apple ייפסק בשקט.**
- ✅ Copyright ("2026 איתי טייב") ו-Secondary Category (Reference) הוגדרו דרך ה-API.
- 🔴 **build #6 נכשל בפועל** (`f1c1b5f9`) — אומת: "Provisioning profile doesn't support the Sign in with Apple capability / doesn't include the com.apple.developer.applesignin entitlement". בדיוק החשש שסימנתי מראש. המשתמש הריץ שוב אינטראקטיבית מהטרמינל שלו — **build #7** (`2eb4364e-f282-4488-9b4a-c5c22f1c1b85`) **הצליח** (כולל ATT + Sign in with Apple + Google Sign-In בשני המסכים, כולל תיקון sign-up).
- ✅ **לקח קריטי שגילינו**: `eas build` **לא** מעלה אוטומטית ל-App Store Connect/TestFlight! זה שני צעדים נפרדים לגמרי — build ואז `eas submit`. build #7 ישב מוכן על שרתי EAS בלי שאף אחד ראה אותו ב-TestFlight, עד שזיהיתי את זה ובדקתי דרך App Store Connect API (`/v1/apps/{id}/builds` הראה רק build #5 הישן). **הרצתי `eas submit --id 2eb4364e...` בעצמי (Bash, לא טרמינל המשתמש — עובד כי submit משתמש ב-API Key, לא בסיסמת אפל) — הצליח, "Submitted your app to Apple App Store Connect!"**. אפל מעבדת (5-10 דק').
- 🎨 **בקשת עיצוב מהמשתמש (2026-09-16, אחרי build #7)**: מסכי sign-in/sign-up עוצבו מחדש בסגנון "Liquid Glass" כחול כמו דף הבית — `LinearGradient` (לבן→כחול #87A9EE) + `BlurView` שמכסה **את כל המסך** (לא כרטיס עם גבול — המשתמש ביקש שהכול "יצוף" ישירות מעל הזכוכית, לא קופסה נפרדת). **לא בבילד #7** (בוצע אחרי). הוחלט (בהסכמת המשתמש) לצבור שינויים קוסמטיים ולעשות **build אחד אחרון** ממש לפני השליחה הסופית לביקורת — לא build על כל שינוי קטן (EAS Free plan מוגבל). build #7 משמש בינתיים ל-TestFlight/בדיקות פונקציונליות.
- ✅ **build #7 עלה ל-TestFlight, המשתמש התקין — קרס מיד בפתיחה.**
- 🔴 **תוקן — קריסה נייטיבית אמיתית באיתור ותיקון מלאים (2026-09-18)**: המשתמש קיבל את ה-invite למייל, התקין, ואפליקציה קרסה מיד בהפעלה. **חקרתי בפועל** דרך App Store Connect API (`betaFeedbackCrashSubmissions` + `crashLog` — לא ניחוש): Thread 1 קרס עם `SIGABRT` בתוך `ObjCTurboModule::performVoidMethodInvocation` (הקריאה למודול נייטיבי TurboModule זרקה חריגת Objective-C לא-מטופלת, כמעט מיד עם ה-launch, לפני שהמשתמש בכלל הספיק לעשות משהו). **הסיבה שאותרה**: `react-native-google-mobile-ads@16.0.0` (הגרסה שהיינו נעולים עליה מסיבה אחרת — בעיית Kotlin באנדרואיד עם 16.5.0) ישנה מכמה תיקוני תאימות קריטיים ל-**New Architecture/TurboModule/bridgeless mode ב-iOS** שיצאו בגרסאות 16.0.2–16.3.4 (מאומת מול ה-changelog הרשמי בגיטהאב, לא השערה). **תוקן**: שדרוג ל-`16.4.0` — כולל את כל תיקוני ה-iOS האלה, בלי לגעת ב-16.5.0 שדרשה Kotlin חדש יותר מדי לאנדרואיד (Kotlin ברירת המחדל של 16.4.0 עדיין 1.8.22, אומת בקוד עצמו).
- ✅ **build #8 (תיקון crash + עיצוב Liquid Glass) נבנה והועלה ל-TestFlight בהצלחה (2026-09-18, 21:xx)**. Build ID: `e4e8be95-c9a9-4979-9f27-8c5de0a65753`, Submission ID: `6c10be7b-1e9a-4b9b-8a1c-587ff7c3e03d`.
- ✅ **DSA Trader status — הושלם וסגור**. המשתמש בחר "I'm **not** a trader under the DSA" (אחרי דיון על הסיכונים — קטנים ורחוקים לאפליקציה בהיקף כזה). ההצהרה נשלחה ואושרה מיד ("You have completed all regulatory requirements at this time") — הבאנר האדום נעלם מדף Business. לא היו שאלות המשך.
- ✅ **תזכורת יומן לחידוש Apple client secret (18.3.2027) — נשלחה ואושרה.**
- 🔴 **build #8 גם קרס** (אותה חתימת קריסה בדיוק — `SIGABRT` ב-`ObjCTurboModule::performVoidMethodInvocation`). **תיקון ה-AdMob לא היה הסיבה האמיתית** — מסקנה שגויה שהופרכה בפועל.
- ✅ **build #9 (2026-09-18, 22:35) — ניסיון עם `--clear-cache`**, גם הוא נכשל (אותה חתימה). התברר שה"fingerprint" הזהה בין builds **לא** מעיד על מטמון תקוע — זו טביעת אצבע לגיטימית שלא השתנתה כי אין שינוי אמיתי בתלויות הנייטיביות. **מסקנה שגויה נוספת שהופרכה.**
- 🎯 **השורש האמיתי נמצא (2026-09-18, 22:5x) — לא ניחוש, אימות מקומי בפועל**: בניתי build לסימולטור, התקנתי עם `xcrun simctl`, הרצתי `bun dev` + חיבור דרך deep link (`teoria://expo-development-client/...`), וקיבלתי מסך שגיאה **לא-מקוצץ** (בניגוד ל-TestFlight): **"Cannot find native module 'ExpoWebBrowser'"** ב-`useOAuthSignIn.ts:3`, ב-scope גלובלי (נזרק ברגע טעינת מסך ההתחברות). הרצתי `bunx expo install --check` וגילה: **כל הספריות שהתקנתי בסשן הזה עם `bun add` הרגיל** (`expo-web-browser`, `expo-apple-authentication`, `expo-tracking-transparency`, `expo-store-review`) **נמשכו בגרסאות שגויות** — מיועדות ל-Expo SDK 57, לא ל-SDK 54 של הפרויקט (למשל `expo-web-browser@57.0.3` במקום `~15.0.11`). שגיאת JS לא-מטופלת כזו ב-production (בלי ה-red-box של dev) הופכת לקריסה נייטיבית. **תוקן**: `bunx expo install --fix` — קיבע את כל השישה (כולל expo-constants, expo-updates) לגרסאות הנכונות, והוסיף אוטומטית plugin נדרש ל-`expo-web-browser` ב-`app.json`.
- ⚠️ **לקח קריטי לזכור**: **תמיד `bunx expo install <package>`, לעולם לא `bun add <package>`** להתקנת חבילות Expo/native — `bun add` מושך latest מ-npm בלי להתחשב בגרסת ה-SDK של הפרויקט.
- ⏳ **build #10 (סימולטור, לאימות) רץ** — commit `fa4271b` עם התיקון. **המחשב נסגר לפני שהספקתי לבדוק** — צריך להמשיך מכאן בפעם הבאה: לבדוק את התוצאה, ואם תוקן → build production אחרון (#11) → submit → TestFlight → לבדוק בפועל (Sign in with Apple/Google/ATT) → לצלם מסכים אמיתיים → למלא בדף החנות → Submit ל-Review.
- ✅ **שני פיצ'רים חדשים לפי בקשת המשתמש (2026-09-16)**: (1) חלון דירוג **רשמי** (Apple/Google, לא מסך שלנו — כדי לא להפר Guideline 5.6.1 נגד review-gating) נפתח אוטומטית מיד אחרי מבחן מדמה שעבר (`app/(authenticated)/results.tsx`, `expo-store-review`). (2) תזכורות Push נעצרות אוטומטית אם המשתמש קבע `testDate` שכבר עבר — חוזרות ברגע שהוא מזין תאריך עתידי חדש (`convex/notifications.ts`).
- ✅ **המשתמש השלים בעצמו (2026-09-15), עם הנחיה חיה בצ'אט**: Legal Entity מאומת, U.S. Form W-8BEN (Active — כולל Foreign TIN = ת.ז ישראלית, לפי טיפים רשמיים של אפל שצורפו ע"י המשתמש: שדה 10 באמת לא נדרש, "not normally applicable"), U.S. Certificate of Foreign Status (Active), חשבון בנק ישראלי נשלח (**Processing — עד 24 שעות**).
- ⏳ **חוסם נוכחי**: Paid Apps Agreement יעבור ל-Active רק אחרי שהבנק יאושר (עד 24 שעות מ-2026-09-15). עד אז אי אפשר לעדכן עוד פרטי בנק/מס. **הצעד הבא אחרי ה-24 שעות**: לבדוק שוב את Business tab ב-App Store Connect — אם Paid Apps Agreement Active, לבדוק אם Small Business Program נפתח.
- לא דחוף: באנר "EU trader status" (Digital Services Act) מופיע בעמוד Business — לא חוסם, אפשר לטפל בנפרד.
