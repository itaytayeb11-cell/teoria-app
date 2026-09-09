#!/usr/bin/env node
// ============================================================================
// המרת מאגר השאלות הרשמי של משרד התחבורה לפורמט של האפליקציה
// ============================================================================
// מקור: data.gov.il — dataset "tqhe" (מאגר השאלות למבחן תאוריה, עברית)
// API של CKAN datastore — לא דורש הורדת קובץ ידנית.
//
// שימוש:
//   node scripts/convert-questions.mjs
//
// פלט:
//   scripts/questions.jsonl  — שורה אחת לכל שאלה, בפורמט טבלת `questions` של Convex
//
// אחרי זה מריצים:
//   bunx convex import --table questions --replace scripts/questions.jsonl

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// מזהה המשאב במאגר הממשלתי (פורמט XML/RSS, מכיל את כל השדות)
const RESOURCE_ID = '8c0f314f-583d-48b6-9f5f-4483d95f6848';
const API = `https://data.gov.il/api/3/action/datastore_search?resource_id=${RESOURCE_ID}`;
const PAGE = 1000;

// מיפוי סימני סוגי רישיון (בנתונים יש תו קירילי שגוי עבור B)
const LICENSE_FIX = { В: 'B' };

// הסרת תגי HTML וניקוי רווחים
function stripHtml(input) {
  return input
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchAll() {
  const records = [];
  let offset = 0;
  for (;;) {
    const res = await fetch(`${API}&limit=${PAGE}&offset=${offset}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (teoria-app build script)' },
    });
    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }
    const json = await res.json();
    const batch = json.result.records;
    records.push(...batch);
    if (batch.length < PAGE) {
      break;
    }
    offset += PAGE;
  }
  return records;
}

function convert(record) {
  const html = record.description4 ?? '';

  // מזהה רשמי + נוסח השאלה מתוך "1759. <שאלה>"
  const titleMatch = record.title2.match(/^\s*(\d+)\.\s*(.*)$/s);
  if (!titleMatch) {
    return null;
  }
  const officialId = titleMatch[1];
  const text = stripHtml(titleMatch[2]);

  // ארבע התשובות מתוך <li>...</li>, כולל זיהוי הנכונה לפי id="correctAnswerXXXX"
  const liBlocks = [...html.matchAll(/<li>(.*?)<\/li>/gs)].map((m) => m[1]);
  if (liBlocks.length !== 4) {
    return null;
  }
  const answers = liBlocks.map((li) => stripHtml(li));
  const correctAnswer = liBlocks.findIndex((li) =>
    /id="correctAnswer\d+"/.test(li)
  );
  if (correctAnswer < 0) {
    return null;
  }

  // תמונה (תמרור / מצב תנועה) — כתובת ציבורית באתר gov.il
  const imgMatch = html.match(/<img[^>]+src="([^"]+)"/i);
  const imageUrl = imgMatch ? imgMatch[1] : undefined;

  // סוגי רישיון רלוונטיים מתוך «C1» «C» «D» ...
  const licenseTypes = [...html.matchAll(/«([^»]+)»/g)]
    .map((m) => LICENSE_FIX[m[1]] ?? m[1])
    .filter((v, i, a) => a.indexOf(v) === i);

  return {
    text,
    answers,
    correctAnswer,
    category: record.category?.trim() || 'כללי',
    difficulty: 3, // המאגר הרשמי לא כולל דרגת קושי — ברירת מחדל, נכוונן בהמשך
    ...(imageUrl ? { imageUrl } : {}),
    ...(licenseTypes.length ? { licenseTypes } : {}),
    officialId,
    isActive: true,
  };
}

async function main() {
  process.stdout.write('▶ Fetching official question bank from data.gov.il...\n');
  const records = await fetchAll();
  process.stdout.write(`  got ${records.length} raw records\n`);

  const converted = [];
  let skipped = 0;
  for (const record of records) {
    const q = convert(record);
    if (q) {
      converted.push(q);
    } else {
      skipped += 1;
    }
  }

  const outPath = resolve('scripts/questions.jsonl');
  writeFileSync(outPath, converted.map((q) => JSON.stringify(q)).join('\n'));

  const byCategory = {};
  let withImage = 0;
  for (const q of converted) {
    byCategory[q.category] = (byCategory[q.category] ?? 0) + 1;
    if (q.imageUrl) {
      withImage += 1;
    }
  }

  process.stdout.write(
    `\n✅ Wrote ${converted.length} questions to ${outPath}\n` +
      `   skipped (unparseable): ${skipped}\n` +
      `   with image: ${withImage}\n` +
      `   by category: ${JSON.stringify(byCategory, null, 2)}\n\n` +
      'Next: bunx convex import --table questions --replace scripts/questions.jsonl\n'
  );
}

main().catch((err) => {
  process.stderr.write(`\n❌ ${err.message}\n`);
  process.exit(1);
});
