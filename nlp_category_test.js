/**
 * NLP Supervisor Matching — Category Precision Test
 * ---------------------------------------------------
 * Uses Kaggle FYP dataset as ground truth: each project has a domain label
 * (e.g. "NLP", "Data Science", "Cybersecurity") which maps to the system's
 * 10 expertise categories. We check whether the algorithm's top recommendations
 * include a supervisor whose expertise matches the project's domain.
 *
 * Setup:
 *   cp "FYP Data.csv" /Users/haziqhilmi/Documents/fyp/fyp/FYP_Data.csv
 *
 * Run:
 *   cd /Users/haziqhilmi/Documents/fyp/fyp && node nlp_category_test.js
 */

import { recommendSupervisors, warmUp } from './server/services/embeddingService.js';
import { readFileSync } from 'fs';

// ─── Supervisor profiles (from seed.js) ───────────────────────────────────────
const supervisors = [
  { id:  1, name: 'Azlan Bin Ismail',                        expertise: ['Machine Learning & Deep Learning', 'Web & Mobile Development', 'Data Science & Analytics'] },
  { id:  2, name: 'Marshima Binti Mohd Rosli',               expertise: ['Machine Learning & Deep Learning', 'Data Science & Analytics', 'Software Engineering'] },
  { id:  3, name: 'Noraini Binti Seman',                     expertise: ['Natural Language Processing', 'Machine Learning & Deep Learning', 'Data Science & Analytics'] },
  { id:  4, name: 'Norhaslinda Binti Kamaruddin',            expertise: ['Machine Learning & Deep Learning', 'Artificial Intelligence', 'Data Science & Analytics'] },
  { id:  5, name: 'Norizan Binti Mat Diah',                  expertise: ['Learning Technology & HCI', 'Machine Learning & Deep Learning'] },
  { id:  6, name: 'Nur Atiqah Sia Binti Abdullah',           expertise: ['Software Engineering', 'Data Science & Analytics', 'Natural Language Processing'] },
  { id:  7, name: 'Shafaf Ibrahim',                          expertise: ['Software Engineering'] },
  { id:  8, name: 'Suriyani Binti Ariffin',                  expertise: ['Cybersecurity & Cryptography'] },
  { id:  9, name: 'Hafizatul Hanin Binti Hamzah',            expertise: ['Software Engineering'] },
  { id: 10, name: 'Hana Fakhira Binti Almarzuki',            expertise: ['Software Engineering'] },
  { id: 11, name: 'Afiza Binti Ismail',                      expertise: ['Software Engineering'] },
  { id: 12, name: 'Ali Bin Seman',                           expertise: ['Artificial Intelligence', 'Data Science & Analytics'] },
  { id: 13, name: 'Haslizatul Fairuz Binti Mohamed Hanum',   expertise: ['Natural Language Processing', 'Information Systems & Database'] },
  { id: 14, name: 'Hayati Binti Abdul Rahman',               expertise: ['Learning Technology & HCI'] },
  { id: 15, name: 'Mohd Suffian Bin Sulaiman',               expertise: ['Software Engineering', 'Computer Vision & Image Processing', 'Artificial Intelligence'] },
  { id: 16, name: 'Muhammad Amir Khan',                      expertise: ['Machine Learning & Deep Learning', 'Computer Vision & Image Processing', 'Natural Language Processing', 'Data Science & Analytics'] },
  { id: 17, name: 'Muhammad Izzad Bin Ramli',                expertise: ['Machine Learning & Deep Learning', 'Web & Mobile Development', 'Data Science & Analytics'] },
  { id: 18, name: 'Noor Latiffah Binti Adam',                expertise: ['Information Systems & Database', 'Natural Language Processing'] },
  { id: 19, name: 'Nor Ashikin Binti Mohamad Kamal',        expertise: ['Machine Learning & Deep Learning', 'Computer Vision & Image Processing', 'Data Science & Analytics'] },
  { id: 20, name: 'Norzilah Binti Musa',                     expertise: ['Learning Technology & HCI', 'Information Systems & Database'] },
  { id: 21, name: 'Nur Farraliza Binti Mansor',              expertise: ['Software Engineering'] },
  { id: 22, name: 'Prasanna A/P Ramakrisnan',                expertise: ['Learning Technology & HCI', 'Data Science & Analytics'] },
  { id: 23, name: 'Razulaimi Bin Razali',                    expertise: ['Machine Learning & Deep Learning', 'Software Engineering', 'Cybersecurity & Cryptography', 'Artificial Intelligence'] },
  { id: 24, name: 'Shakirah Binti Hashim',                   expertise: ['Software Engineering'] },
  { id: 25, name: 'Sharifah Binti Aliman',                   expertise: ['Information Systems & Database'] },
  { id: 26, name: 'Sharifalillah Binti Nordin',              expertise: ['Information Systems & Database'] },
  { id: 27, name: 'Siti Khatijah Nor Binti Abdul Rahim',     expertise: ['Artificial Intelligence', 'Software Engineering'] },
  { id: 28, name: 'Suzana Binti Ahmad',                      expertise: ['Information Systems & Database'] },
  { id: 29, name: 'Syed Mohd Zahid Bin Syed Zainal Ariffin',expertise: ['Computer Vision & Image Processing'] },
  { id: 30, name: 'Tajul Rosli Bin Razak',                   expertise: ['Artificial Intelligence'] },
  { id: 31, name: 'Tengku Zatul Hidayah Binti Tengku Petra', expertise: ['Software Engineering'] },
  { id: 32, name: 'Zainura Binti Idrus',                     expertise: ['Data Science & Analytics', 'Learning Technology & HCI'] },
  { id: 33, name: 'Waheed Yasin Mohammed Abdul-Wahid',       expertise: ['Software Engineering'] },
  { id: 34, name: 'Ahmad Taufiq Bin Haji Mohamad',           expertise: ['Machine Learning & Deep Learning', 'Data Science & Analytics'] },
  { id: 35, name: 'Azizian Bin Mohd Sapawi',                 expertise: ['Information Systems & Database'] },
  { id: 36, name: 'Muhamad Ridhwan Bin Mohamad Razali',      expertise: ['Machine Learning & Deep Learning', 'Data Science & Analytics'] },
  { id: 37, name: 'Syamsulhairi Bin Yaakop',                 expertise: ['Information Systems & Database'] },
  { id: 38, name: 'Norasiah Binti Mohammaddr',               expertise: ['Natural Language Processing'] },
  { id: 39, name: 'Nurul Hijja Binti Mazlan',                expertise: ['Learning Technology & HCI'] },
  { id: 40, name: 'Ahmad Faiz Ghazali',                      expertise: ['Software Engineering'] },
  { id: 41, name: 'Mohd Nor Hajar Hasrol Jono',              expertise: ['Software Engineering'] },
  { id: 42, name: 'Ismadi Bin Md Badarudin',                 expertise: ['Artificial Intelligence', 'Information Systems & Database'] },
];

// ─── Supervisor pool coverage (how many supervisors per category) ──────────────
const CATEGORY_COVERAGE = {};
for (const s of supervisors) {
  for (const e of s.expertise) {
    CATEGORY_COVERAGE[e] = (CATEGORY_COVERAGE[e] || 0) + 1;
  }
}

// ─── Domain → Expected System Categories ─────────────────────────────────────
function mapDomain(domainStr) {
  const d = domainStr.toLowerCase();
  const cats = new Set();

  // Specific signals first (order matters — more specific before generic "ai")
  if (d.includes('nlp') || d.includes('natural language') || d.includes('speech/nlp') || d.includes('audio-nlp'))
    cats.add('Natural Language Processing');

  if (d.includes('computer vision') || d.includes('ar/vr') || d.includes('/vr') ||
      d.includes('vr/') || d.includes('image processing'))
    cats.add('Computer Vision & Image Processing');

  if (d.includes('data science') || d.includes('analytics') ||
      d.includes('recommendation system'))
    cats.add('Data Science & Analytics');

  if (d.includes('cybersecurity') || d.includes('security') || d.includes('blockchain') ||
      d.includes('encryption') || d.includes('crypto') || d.includes('smart contract'))
    cats.add('Cybersecurity & Cryptography');

  if (d.includes('web dev') || d.includes('web development') || d.includes('mobile dev') ||
      d.includes('mobile development') || d.includes('mobile app') || d.includes('mobile/') ||
      d.includes('/web') || d.includes('web/'))
    cats.add('Web & Mobile Development');

  if (d.includes('human-computer interaction') || d.includes('hci') ||
      d.includes('education') || d.includes('e-learning') || d.includes('ar/education'))
    cats.add('Learning Technology & HCI');

  if (d.includes('information system') || d.includes('database'))
    cats.add('Information Systems & Database');

  if (d.includes('machine learning') || d.includes('deep learning') ||
      d.includes('edge ai') || d.includes('audio dl') || d.includes('generative model'))
    cats.add('Machine Learning & Deep Learning');

  // Speech and audio → NLP
  if (d.includes('speech') || d.includes('audio processing'))
    cats.add('Natural Language Processing');

  // Generic "ai" → both ML and AI categories
  if (d.includes('ai') || d.includes('artificial intelligence')) {
    cats.add('Machine Learning & Deep Learning');
    cats.add('Artificial Intelligence');
  }

  return [...cats];
}

// ─── Simple CSV parser (handles quoted commas) ────────────────────────────────
function parseCSV(content) {
  const lines = content.replace(/\r/g, '').split('\n').filter(l => l.trim());
  const headers = splitCSVLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = splitCSVLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? '').trim()]));
  });
}

function splitCSVLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { out.push(cur); cur = ''; }
    else { cur += ch; }
  }
  out.push(cur);
  return out;
}

// ─── Check if a supervisor's expertise intersects the expected categories ─────
function isMatch(supervisor, expectedCats) {
  return supervisor.expertise.some(e => expectedCats.includes(e));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const csvPath = process.argv[2] ?? './FYP_Data.csv';
let rawCSV;
try {
  rawCSV = readFileSync(csvPath, 'utf-8');
} catch {
  console.error(`\n❌  Cannot read CSV at: ${csvPath}`);
  console.error('   Copy the file first:');
  console.error('   cp "FYP Data.csv" /Users/haziqhilmi/Documents/fyp/fyp/FYP_Data.csv\n');
  process.exit(1);
}

const rows = parseCSV(rawCSV);

// Filter rows: need title, abstract, and at least one mappable category
const testCases = rows
  .filter(r => r.title?.trim() && r.abstract?.trim() && r.domain?.trim())
  .map(r => ({ title: r.title, abstract: r.abstract, domain: r.domain, expectedCats: mapDomain(r.domain) }))
  .filter(r => r.expectedCats.length > 0);

console.log(`\n📋  CSV rows: ${rows.length}  |  Usable test cases: ${testCases.length}  |  Excluded (no mappable category): ${rows.length - testCases.length}`);
console.log('\n⏳  Warming up embedding model...\n');
await warmUp();

const results = [];

for (let i = 0; i < testCases.length; i++) {
  const tc = testCases[i];
  const query = `${tc.title}. ${tc.abstract}`;

  // Top-5 is enough; we only need to check @1 and @3
  const ranked = await recommendSupervisors(query, supervisors, 5);

  const matchAt1 = isMatch(ranked[0], tc.expectedCats);
  const matchAt3 = ranked.slice(0, 3).some(s => isMatch(s, tc.expectedCats));

  results.push({
    title: tc.title,
    domain: tc.domain,
    expectedCats: tc.expectedCats,
    top1: ranked[0],
    top3: ranked.slice(0, 3),
    matchAt1,
    matchAt3,
  });

  process.stdout.write(`\r  ${i + 1}/${testCases.length} — ${tc.title.slice(0, 55)}`);
}

// ─── Per-case output ──────────────────────────────────────────────────────────
console.log('\n\n' + '═'.repeat(130));
console.log('CATEGORY PRECISION TEST — PER CASE RESULTS');
console.log('═'.repeat(130));

const pad = (s, n) => String(s ?? '').padEnd(n).slice(0, n);

console.log([pad('Title', 45), pad('Domain', 22), pad('Top-1 Supervisor', 28), pad('Top-1 Expertise', 35), pad('@1', 5), pad('@3', 5)].join(' '));
console.log('─'.repeat(145));

for (const r of results) {
  const top1Exp = r.top1.expertise.join(', ');
  console.log([
    pad(r.title, 45),
    pad(r.domain, 22),
    pad(r.top1.name.split(' ').slice(0, 3).join(' '), 28),
    pad(top1Exp, 35),
    r.matchAt1 ? '  ✓  ' : '  ✗  ',
    r.matchAt3 ? '  ✓  ' : '  ✗  ',
  ].join(' '));
}

// ─── Per-domain breakdown ─────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(80));
console.log('BREAKDOWN BY DOMAIN');
console.log('═'.repeat(80));

// Group by primary domain keyword
const domainGroups = {};
for (const r of results) {
  // Pick a readable primary label
  const primary = r.expectedCats[0] ?? r.domain;
  if (!domainGroups[primary]) domainGroups[primary] = [];
  domainGroups[primary].push(r);
}

console.log(pad('Expected Category', 38) + pad('N', 5) + pad('P@1', 10) + pad('P@3', 10) + 'Pool');
console.log('─'.repeat(80));
for (const [cat, group] of Object.entries(domainGroups).sort()) {
  const p1 = group.filter(r => r.matchAt1).length;
  const p3 = group.filter(r => r.matchAt3).length;
  const pool = CATEGORY_COVERAGE[cat] ?? 0;
  console.log(
    pad(cat, 38) +
    pad(group.length, 5) +
    pad(`${p1}/${group.length} (${(p1/group.length*100).toFixed(0)}%)`, 10) +
    pad(`${p3}/${group.length} (${(p3/group.length*100).toFixed(0)}%)`, 10) +
    `${pool} supervisor(s)`
  );
}

// ─── Overall summary ──────────────────────────────────────────────────────────
const N = results.length;
const totalP1 = results.filter(r => r.matchAt1).length;
const totalP3 = results.filter(r => r.matchAt3).length;

console.log('\n' + '═'.repeat(60));
console.log('OVERALL SUMMARY');
console.log('═'.repeat(60));
console.log(`Total test cases                : ${N}`);
console.log(`Category Precision @ 1 (CP@1)  : ${totalP1}/${N} = ${(totalP1/N*100).toFixed(1)}%`);
console.log(`Category Precision @ 3 (CP@3)  : ${totalP3}/${N} = ${(totalP3/N*100).toFixed(1)}%`);
console.log('');
console.log('Interpretation:');
console.log('  CP@1 = top recommendation has expertise in the correct domain');
console.log('  CP@3 = at least one of top-3 has expertise in the correct domain');
console.log('');
console.log('Note: CP@K is bounded by supervisor pool coverage.');
console.log('  Cybersecurity & Cryptography : 2 supervisors');
console.log('  Web & Mobile Development     : 2 supervisors');
console.log('  Computer Vision              : 4 supervisors');
console.log('  Other categories             : 6-12 supervisors');
console.log('═'.repeat(60));
console.log('\n✅  Test complete.\n');
