#!/usr/bin/env node
// ============================================================================
// סקריפט התקנה ידידותי לתלמידים / Friendly setup script for students
// ============================================================================
// מטרה: להריץ את כל ההגדרה החד-פעמית בפקודה אחת, עם הודעות ברורות.
// Goal: run all one-time setup in a single command, with clear messages.
//
// מה זה עושה / What it does:
//   1. bun install                 — מתקין את כל החבילות / installs packages
//   2. bunx convex dev --once      — יוצר Backend אישי ושומר מפתחות / creates backend + keys
//   3. bunx @convex-dev/auth       — מגדיר מפתחות התחברות / sets up login (auth) keys
//
// אחרי שזה מסתיים, מריצים `bun dev` כדי לראות את האפליקציה.
// When this finishes, run `bun dev` to see the app.

import { spawn } from 'node:child_process';

// צבעים פשוטים לפלט קריא יותר / simple colors for readable output
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

// הערה: רוב הטרמינלים לא תומכים בעברית (RTL) ומציגים אותה הפוך.
// לכן האנגלית תמיד ראשונה ובשורה נפרדת — היא השורה האמינה לתלמיד.
// Note: most terminals don't support Hebrew (RTL) and show it mirrored.
// So English always comes first on its own line — that's the reliable one.
function banner(english, hebrew) {
  process.stdout.write(
    `\n${c.bold}${c.blue}▶ ${english}${c.reset}\n` +
      `  ${c.blue}${hebrew}${c.reset}\n\n`
  );
}

// הרצת פקודה והמתנה לסיומה / run a command and wait for it to finish
//
// shell: true חיוני לתאימות חוצה-מערכות:
// - ב-Windows, bun/bunx הם קבצי .cmd ש-spawn לא ימצא בלי shell.
// - ב-Mac/Linux זה עובד דרך /bin/sh.
// shell: true is essential for cross-platform support:
// - On Windows, bun/bunx are .cmd files spawn won't find without a shell.
// - On Mac/Linux it runs via /bin/sh.
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: true });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`"${command} ${args.join(' ')}" exited with code ${code}`)
        );
      }
    });
    child.on('error', reject);
  });
}

async function main() {
  process.stdout.write(
    `\n${c.bold}${c.green}🚀 Starting setup${c.reset}\n` +
      `${c.green}   מתחילים בהתקנה${c.reset}\n`
  );

  // שלב 1: התקנת חבילות / install packages
  banner('Step 1/3 — installing packages', 'שלב 1 מתוך 3 — מתקין חבילות');
  await run('bun', ['install']);

  // שלב 2: יצירת Backend אישי / create personal backend
  banner(
    'Step 2/3 — creating your database (a browser opens, log in & approve)',
    'שלב 2 מתוך 3 — יוצר מסד נתונים (ייפתח דפדפן, התחברו ואשרו)'
  );
  await run('bunx', ['convex', 'dev', '--once']);

  // שלב 3: הגדרת התחברות / set up auth keys
  banner(
    'Step 3/3 — setting up login (sign-in & sign-up)',
    'שלב 3 מתוך 3 — מגדיר התחברות'
  );
  await run('bunx', ['@convex-dev/auth', '--skip-git-check']);

  // סיום / done
  process.stdout.write(
    `\n${c.bold}${c.green}✅ Setup complete!${c.reset}\n` +
      `${c.green}   ההתקנה הושלמה${c.reset}\n\n` +
      `${c.bold}Now run:${c.reset}  ${c.green}bun dev${c.reset}\n` +
      `${c.blue}  (עכשיו הריצו)${c.reset}\n\n` +
      `${c.yellow}📱 Scan the QR code with the Expo Go app on your phone${c.reset}\n` +
      `${c.blue}   סרקו את הקוד עם אפליקציית Expo Go בטלפון${c.reset}\n\n`
  );
}

main().catch((err) => {
  process.stdout.write(
    `\n${c.bold}${c.red}❌ Something went wrong${c.reset}\n` +
      `${c.red}   משהו השתבש${c.reset}\n` +
      `${c.red}${err.message}${c.reset}\n\n` +
      `${c.yellow}Try running it again:${c.reset}  ${c.yellow}bun run setup${c.reset}\n` +
      `${c.blue}  (נסו להריץ שוב)${c.reset}\n\n`
  );
  process.exit(1);
});
