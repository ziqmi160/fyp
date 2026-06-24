/**
 * NLP Supervisor Matching — Accuracy Test
 * ----------------------------------------
 * Run from the /fyp directory:  node nlp_accuracy_test.js
 *
 * Imports embeddingService.js directly (no DB / server needed).
 * Uses the same supervisor expertise and student descriptions that are
 * seeded into the database, and the same query construction logic as
 * getRecommendations() in supervisorController.js.
 *
 * Outputs:
 *   - Per-case table: assigned supervisor rank, score, top-3
 *   - HR@1, HR@3, HR@5, MRR
 *   - Confusion matrix (top-3 threshold, per supervisor-student pair)
 */

import { recommendSupervisors, warmUp } from './server/services/embeddingService.js';

// ─── Supervisor profiles (from seed.js, index 0-41) ──────────────────────────
const supervisorData = [
  { name: 'Azlan Bin Ismail',                        expertise: ['Machine Learning & Deep Learning', 'Web & Mobile Development', 'Data Science & Analytics'] },
  { name: 'Marshima Binti Mohd Rosli',                expertise: ['Machine Learning & Deep Learning', 'Data Science & Analytics', 'Software Engineering'] },
  { name: 'Noraini Binti Seman',                      expertise: ['Natural Language Processing', 'Machine Learning & Deep Learning', 'Data Science & Analytics'] },
  { name: 'Norhaslinda Binti Kamaruddin',             expertise: ['Machine Learning & Deep Learning', 'Artificial Intelligence', 'Data Science & Analytics'] },
  { name: 'Norizan Binti Mat Diah',                   expertise: ['Learning Technology & HCI', 'Machine Learning & Deep Learning'] },
  { name: 'Nur Atiqah Sia Binti Abdullah',            expertise: ['Software Engineering', 'Data Science & Analytics', 'Natural Language Processing'] },
  { name: 'Shafaf Ibrahim',                           expertise: ['Software Engineering'] },
  { name: 'Suriyani Binti Ariffin',                   expertise: ['Cybersecurity & Cryptography'] },
  { name: 'Hafizatul Hanin Binti Hamzah',             expertise: ['Software Engineering'] },
  { name: 'Hana Fakhira Binti Almarzuki',             expertise: ['Software Engineering'] },
  { name: 'Afiza Binti Ismail',                       expertise: ['Software Engineering'] },
  { name: 'Ali Bin Seman',                            expertise: ['Artificial Intelligence', 'Data Science & Analytics'] },
  { name: 'Haslizatul Fairuz Binti Mohamed Hanum',    expertise: ['Natural Language Processing', 'Information Systems & Database'] },
  { name: 'Hayati Binti Abdul Rahman',                expertise: ['Learning Technology & HCI'] },
  { name: 'Mohd Suffian Bin Sulaiman',                expertise: ['Software Engineering', 'Computer Vision & Image Processing', 'Artificial Intelligence'] },
  { name: 'Muhammad Amir Khan',                       expertise: ['Machine Learning & Deep Learning', 'Computer Vision & Image Processing', 'Natural Language Processing', 'Data Science & Analytics'] },
  { name: 'Muhammad Izzad Bin Ramli',                 expertise: ['Machine Learning & Deep Learning', 'Web & Mobile Development', 'Data Science & Analytics'] },
  { name: 'Noor Latiffah Binti Adam',                 expertise: ['Information Systems & Database', 'Natural Language Processing'] },
  { name: 'Nor Ashikin Binti Mohamad Kamal',         expertise: ['Machine Learning & Deep Learning', 'Computer Vision & Image Processing', 'Data Science & Analytics'] },
  { name: 'Norzilah Binti Musa',                      expertise: ['Learning Technology & HCI', 'Information Systems & Database'] },
  { name: 'Nur Farraliza Binti Mansor',               expertise: ['Software Engineering'] },
  { name: 'Prasanna A/P Ramakrisnan',                 expertise: ['Learning Technology & HCI', 'Data Science & Analytics'] },
  { name: 'Razulaimi Bin Razali',                     expertise: ['Machine Learning & Deep Learning', 'Software Engineering', 'Cybersecurity & Cryptography', 'Artificial Intelligence'] },
  { name: 'Shakirah Binti Hashim',                    expertise: ['Software Engineering'] },
  { name: 'Sharifah Binti Aliman',                    expertise: ['Information Systems & Database'] },
  { name: 'Sharifalillah Binti Nordin',               expertise: ['Information Systems & Database'] },
  { name: 'Siti Khatijah Nor Binti Abdul Rahim',      expertise: ['Artificial Intelligence', 'Software Engineering'] },
  { name: 'Suzana Binti Ahmad',                       expertise: ['Information Systems & Database'] },
  { name: 'Syed Mohd Zahid Bin Syed Zainal Ariffin', expertise: ['Computer Vision & Image Processing'] },
  { name: 'Tajul Rosli Bin Razak',                    expertise: ['Artificial Intelligence'] },
  { name: 'Tengku Zatul Hidayah Binti Tengku Petra',  expertise: ['Software Engineering'] },
  { name: 'Zainura Binti Idrus',                      expertise: ['Data Science & Analytics', 'Learning Technology & HCI'] },
  { name: 'Waheed Yasin Mohammed Abdul-Wahid',        expertise: ['Software Engineering'] },
  { name: 'Ahmad Taufiq Bin Haji Mohamad',            expertise: ['Machine Learning & Deep Learning', 'Data Science & Analytics'] },
  { name: 'Azizian Bin Mohd Sapawi',                  expertise: ['Information Systems & Database'] },
  { name: 'Muhamad Ridhwan Bin Mohamad Razali',       expertise: ['Machine Learning & Deep Learning', 'Data Science & Analytics'] },
  { name: 'Syamsulhairi Bin Yaakop',                  expertise: ['Information Systems & Database'] },
  { name: 'Norasiah Binti Mohammaddr',                expertise: ['Natural Language Processing'] },
  { name: 'Nurul Hijja Binti Mazlan',                 expertise: ['Learning Technology & HCI'] },
  { name: 'Ahmad Faiz Ghazali',                       expertise: ['Software Engineering'] },
  { name: 'Mohd Nor Hajar Hasrol Jono',               expertise: ['Software Engineering'] },
  { name: 'Ismadi Bin Md Badarudin',                  expertise: ['Artificial Intelligence', 'Information Systems & Database'] },
];

// Assign fake sequential IDs (mirrors what the DB would assign)
const supervisors = supervisorData.map((s, i) => ({ id: i + 1, ...s }));

// ─── Student test cases (seed.js studentData, filtered to those with titles) ──
// Assignment rule mirrors seed.js: supIdx % 20, incrementing per student with title.
const studentData = [
  { name: 'Ahmad Firdaus Bin Abdullah',      title: 'AI-Based Traffic Flow Prediction System',              description: 'Developing a deep learning model to predict urban traffic congestion using real-time sensor data.' },
  { name: 'Nurul Izzati Binti Mohd Azmi',    title: 'Sentiment Analysis of Social Media Text',              description: 'Using NLP techniques to classify sentiment in Malay and English social media posts.' },
  { name: 'Muhammad Hafiz Bin Hassan',        title: 'Face Recognition Attendance System',                   description: 'A contactless attendance tracking system using convolutional neural networks for face recognition.' },
  { name: 'Siti Nurhaliza Binti Ibrahim',     title: 'Smart Home Automation with IoT',                       description: 'An IoT-based home automation system integrating voice control and mobile app management.' },
  { name: 'Amirul Haqim Bin Zainudin',        title: 'Blockchain-Based Academic Certificate Verification',   description: 'Leveraging blockchain technology to create tamper-proof digital academic records.' },
  { name: 'Nur Syafiqah Binti Omar',          title: 'Mobile Mental Health Support App',                     description: 'A cross-platform app providing mood tracking, guided meditation, and peer support features.' },
  { name: 'Mohd Hakimi Bin Rashid',           title: 'Augmented Reality Campus Navigation',                  description: 'Using AR to overlay directional cues and room information over the smartphone camera view.' },
  { name: 'Fatin Aisyah Binti Kamaruddin',    title: 'Predictive Maintenance for Manufacturing Equipment',   description: 'Machine learning model to predict equipment failures from vibration and temperature sensor readings.' },
  { name: 'Zulhafiz Bin Hashim',              title: 'E-Wallet Security Enhancement Using Biometrics',       description: 'Integrating fingerprint and facial recognition as multi-factor authentication for mobile payments.' },
  { name: 'Nursyahirah Binti Mohd Noor',      title: 'Automated Essay Scoring System',                       description: 'NLP model to evaluate and score student essays based on coherence, grammar, and content relevance.' },
  { name: 'Faiz Hakimie Bin Jamal',           title: 'Deepfake Detection Using CNN',                         description: 'Building a convolutional neural network to detect AI-generated manipulated video frames.' },
  { name: 'Sofiah Binti Kamarudin',           title: 'Crop Disease Detection Mobile App',                    description: 'Using transfer learning on plant leaf images to diagnose diseases and suggest treatments.' },
  { name: 'Harith Bin Othman',                title: 'Network Intrusion Detection Using Deep Learning',       description: 'Designing an LSTM-based IDS to detect anomalous network traffic patterns in real time.' },
  { name: 'Khairunnisa Binti Yusoff',         title: 'Recommendation System for Online Learning',            description: 'Collaborative filtering approach to recommend online courses based on learner history and skill gaps.' },
  { name: 'Luqman Hakim Bin Md Nasir',        title: 'Smart Waste Management Using Computer Vision',         description: 'Real-time waste classification system using YOLOv8 to automate recycling bin sorting.' },
  { name: 'Wan Siti Zulaikha Binti Wan Ahmad',title: 'Sign Language Recognition System',                     description: 'Real-time Malaysian Sign Language interpretation using MediaPipe hand landmark detection.' },
  { name: 'Mohd Ridhwan Bin Sulaiman',        title: 'Fraud Detection in Banking Transactions',              description: 'Ensemble learning model combining Random Forest and XGBoost for real-time transaction fraud detection.' },
  { name: 'Nurul Ain Binti Mat Isa',          title: 'Health Monitoring Wearable Dashboard',                 description: 'Real-time dashboard for visualizing wearable sensor data including heart rate, SpO2, and activity levels.' },
  { name: 'Hafizuddin Bin Abd Hamid',         title: 'Automated Code Review Tool',                           description: 'Static analysis tool with machine learning to detect code smells and suggest improvements.' },
  { name: 'Syafiqah Adibah Binti Saiful',     title: 'Personalized Diet Recommendation App',                 description: 'Mobile app leveraging user health data and dietary preferences to generate balanced meal plans.' },
  { name: 'Azfar Izzuddin Bin Azmi',          title: 'Forest Fire Prediction Using Satellite Imagery',       description: 'Applying CNN and satellite thermal images to predict wildfire risk zones in real time.' },
  { name: 'Izzati Binti Shamsuddin',          title: 'AI Chatbot for University FAQ',                        description: 'Transformer-based conversational agent trained on UiTM administrative FAQ data.' },
  { name: 'Razif Bin Zainal Abidin',          title: 'Indoor Positioning System Using Wi-Fi Fingerprinting', description: 'Machine learning approach to estimate indoor location using RSSI values from Wi-Fi access points.' },
  { name: 'Nabilah Athirah Binti Zulkifli',   title: 'E-Government Service Satisfaction Analysis',           description: 'Text mining and sentiment analysis on citizen feedback for government digital services.' },
];

// Mirror the seed's supIdx % 20 assignment rule
const testCases = studentData.map((s, i) => ({
  ...s,
  assignedSupervisor: supervisors[i % 20],   // supIdx cycles through first 20 only
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pad(str, n) { return String(str).padEnd(n).slice(0, n); }
function rnd(n, d = 4) { return Number(n).toFixed(d); }

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log('\n⏳  Warming up embedding model (first run downloads ~23 MB)...\n');
await warmUp();

const results = [];

for (let i = 0; i < testCases.length; i++) {
  const tc = testCases[i];
  // Exact same query construction as supervisorController.js getRecommendations()
  const query = [tc.title, tc.description].filter(Boolean).join('. ');

  // Run against ALL 42 supervisors to get full ranking for MRR
  const ranked = await recommendSupervisors(query, supervisors, supervisors.length);

  const assignedRank = ranked.findIndex(r => r.id === tc.assignedSupervisor.id) + 1; // 1-based
  const assignedScore = ranked.find(r => r.id === tc.assignedSupervisor.id)?.match_score ?? 0;
  const top3 = ranked.slice(0, 3);
  const top1Score = ranked[0]?.match_score ?? 0;

  results.push({
    case: i + 1,
    student: tc.name,
    title: tc.title,
    assigned: tc.assignedSupervisor.name,
    assignedExpertise: tc.assignedSupervisor.expertise.join(', '),
    assignedScore,
    assignedRank,
    top1Name: ranked[0]?.name,
    top1Score,
    top3Names: top3.map(r => r.name),
    top3Scores: top3.map(r => r.match_score),
    hitAt1: assignedRank === 1,
    hitAt3: assignedRank <= 3,
    hitAt5: assignedRank <= 5,
    reciprocalRank: 1 / assignedRank,
  });

  process.stdout.write(`\r  Case ${i + 1}/${testCases.length} — ${tc.title.slice(0, 50)}`);
}

console.log('\n\n' + '═'.repeat(120));
console.log('NLP SUPERVISOR MATCHING — ACCURACY TEST RESULTS');
console.log('Model: all-MiniLM-L6-v2 (hybrid scoring: 0.55×category + 0.45×direct)');
console.log('Query: fyp_title + ". " + project_description  (matches getRecommendations controller)');
console.log('═'.repeat(120));

// ─── Per-case table ───────────────────────────────────────────────────────────
console.log('\n' + [
  pad('#',  3), pad('Project Title', 48), pad('Assigned Supervisor', 28),
  pad('Score', 7), pad('Rank', 5), pad('Hit', 5),
  pad('Top-1 Recommended', 30), pad('Top-1 Score', 11),
].join(' '));
console.log('─'.repeat(148));

for (const r of results) {
  const hitLabel = r.hitAt1 ? 'HIT@1' : r.hitAt3 ? 'HIT@3' : r.hitAt5 ? 'HIT@5' : 'MISS ';
  console.log([
    pad(r.case, 3),
    pad(r.title, 48),
    pad(r.assigned.split(' ').slice(0, 2).join(' '), 28),
    pad(rnd(r.assignedScore), 7),
    pad(r.assignedRank, 5),
    pad(hitLabel, 5),
    pad(r.top1Name?.split(' ').slice(0, 2).join(' ') ?? '-', 30),
    pad(rnd(r.top1Score), 11),
  ].join(' '));
}

// ─── Top-3 detail ─────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(120));
console.log('TOP-3 RECOMMENDATIONS PER CASE');
console.log('─'.repeat(120));
for (const r of results) {
  const hitLabel = r.hitAt1 ? '★HIT@1' : r.hitAt3 ? '★HIT@3' : r.hitAt5 ? '★HIT@5' : '  MISS';
  const top3str = r.top3Names.map((n, i) => `${n.split(' ').slice(0,2).join(' ')} (${rnd(r.top3Scores[i])})`).join(' | ');
  console.log(`${pad(r.case, 3)} ${hitLabel}  ${top3str}`);
  console.log(`     Assigned: ${r.assigned} — score ${rnd(r.assignedScore)}, rank #${r.assignedRank}`);
}

// ─── Summary metrics ──────────────────────────────────────────────────────────
const N = results.length;
const hr1 = results.filter(r => r.hitAt1).length;
const hr3 = results.filter(r => r.hitAt3).length;
const hr5 = results.filter(r => r.hitAt5).length;
const mrr = results.reduce((s, r) => s + r.reciprocalRank, 0) / N;
const avgAssigned = results.reduce((s, r) => s + r.assignedScore, 0) / N;
const avgTop1     = results.reduce((s, r) => s + r.top1Score, 0) / N;
const improvement = ((avgTop1 - avgAssigned) / avgAssigned * 100).toFixed(1);

console.log('\n' + '═'.repeat(60));
console.log('SUMMARY METRICS');
console.log('═'.repeat(60));
console.log(`Total test cases              : ${N}`);
console.log(`Hit Rate @ 1  (HR@1)          : ${hr1}/${N} = ${(hr1/N*100).toFixed(1)}%`);
console.log(`Hit Rate @ 3  (HR@3)          : ${hr3}/${N} = ${(hr3/N*100).toFixed(1)}%`);
console.log(`Hit Rate @ 5  (HR@5)          : ${hr5}/${N} = ${(hr5/N*100).toFixed(1)}%`);
console.log(`Mean Reciprocal Rank (MRR)    : ${mrr.toFixed(4)}`);
console.log(`Avg cosine score — assigned   : ${avgAssigned.toFixed(4)}`);
console.log(`Avg cosine score — top-1 rec. : ${avgTop1.toFixed(4)}`);
console.log(`Avg score improvement         : +${improvement}%`);

// ─── Confusion matrix (per supervisor-student pair, K=3) ─────────────────────
// For each of the N×42 pairs:
//   TP: assigned supervisor AND in top-3
//   FN: assigned supervisor AND NOT in top-3
//   FP: NOT assigned AND in top-3
//   TN: NOT assigned AND NOT in top-3
let TP = 0, FN = 0, FP = 0, TN = 0;

for (const r of results) {
  for (const sup of supervisors) {
    const isAssigned    = sup.name === r.assigned;
    const isRecommended = r.top3Names.includes(sup.name);
    if (isAssigned  && isRecommended)  TP++;
    if (isAssigned  && !isRecommended) FN++;
    if (!isAssigned && isRecommended)  FP++;
    if (!isAssigned && !isRecommended) TN++;
  }
}

const precision = TP / (TP + FP) || 0;
const recall    = TP / (TP + FN) || 0;
const f1        = 2 * precision * recall / (precision + recall) || 0;
const accuracy  = (TP + TN) / (TP + FP + FN + TN);

console.log('\n' + '═'.repeat(60));
console.log('CONFUSION MATRIX  (per supervisor-student pair, K=3)');
console.log(`Total pairs evaluated: ${N} students × ${supervisors.length} supervisors = ${N * supervisors.length}`);
console.log('─'.repeat(60));
console.log('                     Recommended  Not Recommended');
console.log(`Assigned supervisor  TP = ${String(TP).padStart(5)}   FN = ${String(FN).padStart(5)}`);
console.log(`Other supervisors    FP = ${String(FP).padStart(5)}   TN = ${String(TN).padStart(5)}`);
console.log('─'.repeat(60));
console.log(`Precision   : ${(precision*100).toFixed(1)}%  (of top-3 recs, how many are the assigned sup?)`);
console.log(`Recall      : ${(recall*100).toFixed(1)}%  (same as HR@3)`);
console.log(`F1 Score    : ${f1.toFixed(4)}`);
console.log(`Accuracy    : ${(accuracy*100).toFixed(1)}%  (dominated by TN — not meaningful alone)`);
console.log('═'.repeat(60));
console.log('\n✅  Test complete. Paste the above results into your Chapter 4.\n');
