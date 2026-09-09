#!/usr/bin/env node
// ============================================================================
// בדיקה אוטומטית לפני הרצת האפליקציה / Auto-check before running the app
// ============================================================================
// רץ אוטומטית לפני `bun dev` (דרך הסקריפט "predev" ב-package.json).
// אם עדיין אין Backend מוגדר — מריץ את ההתקנה לבד, כדי שתלמיד שהריץ
// בטעות `bun dev` ראשון עדיין יגיע למצב עובד. אי אפשר לטעות.
//
// Runs automatically before `bun dev` (via the "predev" script). If no backend
// is configured yet, it runs setup first, so a student who accidentally runs
// `bun dev` before setup still ends up working. Impossible to get wrong.

import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

// ערך הדמה מ-.env.example — נחשב כ"לא מוגדר"
// Placeholder from .env.example — treated as "not configured"
const PLACEHOLDER = 'your-project-name';

// בודק אם קיים Backend אמיתי / checks whether a real backend is configured
function isConfigured() {
  // Convex כותב את המפתחות ל-.env.local / Convex writes keys to .env.local
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) {
      continue;
    }
    const contents = readFileSync(file, 'utf8');
    const match = contents.match(/^EXPO_PUBLIC_CONVEX_URL=(.+)$/m);
    const url = match?.[1]?.trim();
    if (url && !url.includes(PLACEHOLDER)) {
      return true;
    }
  }
  return false;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: true });
    child.on('close', (code) => {
      code === 0 ? resolve() : reject(new Error(`exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function main() {
  if (isConfigured()) {
    // הכל מוגדר — ממשיכים ישר לאפליקציה / all set, continue to the app
    return;
  }

  process.stdout.write(
    `\n${c.bold}${c.yellow}⚙️  First time here — running setup automatically...${c.reset}\n` +
      `${c.blue}   פעם ראשונה — מריץ התקנה אוטומטית${c.reset}\n`
  );

  await run('node', ['scripts/setup.mjs']);
}

main().catch((err) => {
  process.stdout.write(`\n${err.message}\n`);
  process.exit(1);
});
