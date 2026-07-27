// Reseed supervisor expertise from the UiTM lecturer expertise export.
// For each lecturer (matched by name, case-insensitive) this sets:
//   - expertise          : broad 10-category tags, derived from Area/Group/Specific
//   - specific_expertise  : the specific research topics from the sheet
// Lecturers not present in the sheet, or with no Area/Group/Specific data, keep
// their existing expertise tags untouched.
//
// Run: node server/seeders/seedSupervisorExpertise.js
import sequelize from '../config/database.js';
import { User, SupervisorProfile } from '../models/index.js';
import { EXPERTISE_CATEGORIES } from '../services/embeddingService.js';

// Raw rows from UiTM_Lecturer_Expertise_Output.xlsx (name, area, group, specific).
const SOURCE = [
  { name: 'AZLAN BIN ISMAIL', area: 'SOFTWARE ENGINEERING', group: 'SOFTWARE', spec: 'Formal Verification, Cloud Computing, Reinforcement Learning, Data Analytics' },
  { name: 'MARSHIMA BINTI MOHD ROSLI', area: 'SOFTWARE QUALITY', group: 'SOFTWARE ENGINEERING', spec: 'Machine Learning, Predictive Analytics, Class Imbalance, Healthcare Informatics' },
  { name: 'NORAINI BINTI SEMAN', area: 'NATURAL LANGUAGE PROCESSING', group: 'ARTIFICIAL INTELLIGENCE', spec: 'Speech Processing & Recognition, Data Science (Text Analytics), Natural Language Processing, Artificial Intelligence (Machine Learning)' },
  { name: 'NORHASLINDA BINTI KAMARUDDIN', area: 'SOFT COMPUTING', group: 'ARTIFICIAL INTELLIGENCE', spec: 'Speech Emotion Recognition, Brain Signal Affective Recognition (EEG), Big Data Analytics, Neural Network, Fuzzy Neural Network, Cultural-Influence on Speech Emotion, Affective Space Model, Driver Behavior' },
  { name: 'NORIZAN BINTI MAT DIAH', area: 'EDUTAINMENT', group: 'MULTIMEDIA', spec: 'Gamification, Multimedia Technology, Real Time Feedback Engine, Artificial Intelligence (Machine Learning)' },
  { name: 'NUR ATIQAH SIA BINTI ABDULLAH', area: 'SOFTWARE METRICS', group: 'SOFTWARE ENGINEERING', spec: 'Software Engineering, Functional Size Measurement, Software Effort Estimation, Software Project Management, Mobile Game Size Estimation, Social Media Intelligence, Sentiment Analysis, Data Visualization' },
  { name: 'SHAFAF IBRAHIM', area: '', group: '', spec: '' },
  { name: 'SURIYANI BINTI ARIFFIN', area: 'CRYPTOGRAPHY', group: 'SECURITY SYSTEM', spec: 'Cryptographic Algorithms, Blockchain Technology' },
  { name: 'HAFIZATUL HANIN BINTI HAMZAH', area: '', group: '', spec: '' },
  { name: 'HANA FAKHIRA BINTI ALMARZUKI', area: '', group: '', spec: '' },
  { name: 'AFIZA BINTI ISMAIL', area: '', group: '', spec: '' },
  { name: 'ALI BIN SEMAN', area: 'ANALYSIS OF ALGORITHMS AND COMPLEXITY', group: 'COMPUTATION THEORY AND MATHEMATICS', spec: 'Clustering' },
  { name: 'HASLIZATUL FAIRUZ BINTI MOHAMED HANUM', area: 'NATURAL LANGUAGE', group: 'EMERGENT INFORMATION TECHNOLOGY', spec: 'Information Retrieval, Human Language Technology' },
  { name: 'HAYATI BINTI ABDUL RAHMAN', area: 'OTHER SOCIAL SCIENCES N.E.C.', group: 'OTHER SOCIAL SCIENCES N.E.C.', spec: 'Media and Communications, Social Science and Management' },
  { name: 'MOHD SUFFIAN BIN SULAIMAN', area: 'REQUIREMENTS ENGINEERING', group: 'SOFTWARE ENGINEERING', spec: 'Image Retrieval, Software Engineering, Ontology Engineering, Artificial Intelligence' },
  { name: 'MUHAMMAD AMIR KHAN', area: 'MACHINE LEARNING', group: 'ARTIFICIAL INTELLIGENCE', spec: 'Deep Learning, Convolutional Neural Networks (CNN), Recurrent Neural Networks (RNN), Transformers, Medical Diagnosis, Computer Vision, Sentiment Analysis, Health Informatics, Speech and Language Technologies' },
  { name: 'MUHAMMAD IZZAD BIN RAMLI', area: 'SIGNAL ANALYSIS AND PROCESSING', group: 'SIGNAL PROCESSING', spec: 'Machine Learning, Deep Learning, Web Development, Mobile Computing, Games Development' },
  { name: 'NOOR LATIFFAH BINTI ADAM', area: 'ELECTRONIC INFORMATION STORAGE AND RETRIEVAL SERVICES', group: 'INFORMATION SYSTEMS', spec: 'Information Retrieval' },
  { name: 'NOR ASHIKIN BINTI MOHAMAD KAMAL', area: 'MACHINE LEARNING', group: 'ARTIFICIAL INTELLIGENCE', spec: 'Data Mining, Image Processing, Signal Processing' },
  { name: 'NORZILAH BINTI MUSA', area: 'COLLABORATIVE COMPUTING', group: 'WEB TECHNOLOGY', spec: 'Digital Communication Media' },
  { name: 'NUR FARRALIZA BINTI MANSOR', area: '', group: '', spec: '' },
  { name: 'PRASANNA A/P RAMAKRISNAN', area: 'E-LEARNING', group: 'MULTIMEDIA', spec: 'Gamification, Learning Analytics' },
  { name: 'RAZULAIMI BIN RAZALI', area: 'MACHINE LEARNING', group: 'ARTIFICIAL INTELLIGENCE', spec: 'Software Engineering, Networking, Artificial Intelligence' },
  { name: 'SHAKIRAH BINTI HASHIM', area: '', group: '', spec: '' },
  { name: 'SHARIFAH BINTI ALIMAN', area: '', group: '', spec: '' },
  { name: 'SHARIFALILLAH BINTI NORDIN', area: 'OTHER INFORMATION', group: 'OTHER INFORMATION, COMPUTER AND COMMUNICATION TECHNOLOGY (ICT) N.E.C.', spec: '' },
  { name: 'SITI KHATIJAH NOR BINTI ABDUL RAHIM', area: 'EXPERT SYSTEMS', group: 'ARTIFICIAL INTELLIGENCE', spec: 'Computational Intelligence, Software Engineering, Scheduling, Timetabling, Optimization' },
  { name: 'SUZANA BINTI AHMAD', area: 'OTHER INFORMATION', group: 'OTHER INFORMATION, COMPUTER AND COMMUNICATION TECHNOLOGY (ICT) N.E.C.', spec: '' },
  { name: 'SYED MOHD ZAHID BIN SYED ZAINAL ARIFFIN', area: 'DIGITAL IMAGE PROCESSING SYSTEM', group: 'MULTIMEDIA', spec: 'Digital Image Processing' },
  { name: 'TAJUL ROSLI BIN RAZAK', area: 'SOFT COMPUTING', group: 'ARTIFICIAL INTELLIGENCE', spec: 'Artificial Intelligence, Fuzzy Logic System, Hierarchical Fuzzy Systems, Decision Support System, Interpretable System' },
  { name: 'TENGKU ZATUL HIDAYAH BINTI TENGKU PETRA', area: '', group: '', spec: '' },
  { name: 'ZAINURA BINTI IDRUS', area: 'COLLABORATIVE COMPUTING', group: 'OTHER INFORMATION, COMPUTER AND COMMUNICATION TECHNOLOGY (ICT) N.E.C.', spec: 'Data Visualization, Abstract Programming Language, Human-Automation Shared Control in CSCW, Awareness in CSCW' },
  { name: 'WAHEED YASIN MOHAMMED ABDUL-WAHID', area: '', group: '', spec: '' },
  { name: 'AHMAD TAUFIQ BIN HAJI MOHAMAD', area: 'MACHINE LEARNING', group: 'ARTIFICIAL INTELLIGENCE', spec: '' },
  { name: 'AZIZIAN BIN MOHD SAPAWI', area: 'OTHER INFORMATION', group: 'OTHER INFORMATION, COMPUTER AND COMMUNICATION TECHNOLOGY (ICT) N.E.C.', spec: '' },
  { name: 'MUHAMAD RIDHWAN BIN MOHAMAD RAZALI', area: 'MACHINE LEARNING', group: 'ARTIFICIAL INTELLIGENCE', spec: '' },
  { name: 'SYAMSULHAIRI BIN YAAKOP', area: 'OTHER INFORMATION', group: 'OTHER INFORMATION, COMPUTER AND COMMUNICATION TECHNOLOGY (ICT) N.E.C.', spec: '' },
  { name: 'NORASIAH BINTI MOHAMMADDR', area: '', group: '', spec: '' },
  { name: 'NURUL HIJJA BINTI MAZLAN', area: 'COMPUTER ASSISTED INSTRUCTION (CAI)', group: 'EDUCATIONAL TECHNOLOGY', spec: 'Learning Technology, Intelligent Learning System, Interactive Learning Media' },
  { name: 'AHMAD FAIZ GHAZALI', area: '', group: '', spec: '' },
  { name: 'MOHD NOR HAJAR HASROL JONO', area: '', group: '', spec: '' },
  { name: 'ISMADI BIN MD BADARUDIN', area: 'OTHER ARTIFICIAL INTELLIGENCE N.E.C.', group: 'ARTIFICIAL INTELLIGENCE', spec: 'Genetic Algorithm, Optimization, Database Management System' },
];

// Keyword → broad category rules. Each lecturer's combined Area + Group +
// Specific text is scanned; every category with a keyword hit is assigned, in
// the order categories first appear. Ordered most-specific first so the
// dominant area surfaces as the primary tag.
const CATEGORY_RULES = [
  ['Natural Language Processing', ['natural language', 'nlp', 'text analytics', 'speech', 'sentiment', 'information retrieval', 'human language', 'language technolog']],
  ['Computer Vision & Image Processing', ['computer vision', 'image processing', 'image retrieval', 'digital image', 'object detection', 'signal processing', 'signal analysis']],
  ['Machine Learning & Deep Learning', ['machine learning', 'deep learning', 'neural network', 'cnn', 'rnn', 'transformer', 'predictive analytic', 'predictive modelling', 'class imbalance', 'data mining', 'clustering']],
  ['Cybersecurity & Cryptography', ['cryptograph', 'security', 'blockchain', 'intrusion', 'forensic', 'penetration']],
  ['Artificial Intelligence', ['artificial intelligence', 'fuzzy', 'soft computing', 'expert system', 'genetic algorithm', 'optimization', 'scheduling', 'timetabling', 'computational intelligence', 'decision support', 'reinforcement learning', 'evolutionary']],
  ['Software Engineering', ['software engineering', 'software quality', 'software metric', 'requirements engineering', 'functional size', 'effort estimation', 'project management', 'formal verification', 'ontology', 'software']],
  ['Data Science & Analytics', ['data science', 'data analytic', 'big data', 'analytics', 'data visualization', 'data visualisation', 'healthcare informatic', 'health informatic', 'social media intelligence']],
  ['Learning Technology & HCI', ['e-learning', 'edutainment', 'gamification', 'learning analytic', 'learning technolog', 'educational technolog', 'computer assisted instruction', 'multimedia', 'intelligent learning', 'interactive learning', 'hci', 'collaborative computing', 'cscw', 'human-automation']],
  ['Information Systems & Database', ['information system', 'database', 'electronic information', 'knowledge management', 'digital librar', 'information storage', 'dbms']],
  ['Web & Mobile Development', ['web development', 'web technolog', 'mobile computing', 'mobile development', 'games development', 'cloud computing', 'networking', 'digital communication media']],
];

function deriveCategories(area, group, spec) {
  const text = `${area} ${group} ${spec}`.toLowerCase();
  const found = [];
  for (const [category, keywords] of CATEGORY_RULES) {
    if (found.includes(category)) continue;
    if (keywords.some(k => k && text.includes(k))) found.push(category);
  }
  return found;
}

function parseSpecific(spec) {
  if (!spec) return [];
  return spec
    .split(/,(?![^(]*\))/) // split on commas not inside parentheses
    .map(s => s.trim())
    .filter(Boolean);
}

async function run() {
  await sequelize.authenticate();

  const byLower = {};
  for (const row of SOURCE) byLower[row.name.trim().toLowerCase()] = row;

  const profiles = await SupervisorProfile.findAll({
    include: [{ model: User, attributes: ['id', 'name'] }],
  });

  let updatedCats = 0, updatedSpec = 0, keptCats = 0, unmatched = 0;
  for (const profile of profiles) {
    const name = (profile.User?.name || '').trim().toLowerCase();
    const row = byLower[name];
    if (!row) { unmatched++; continue; }

    const specificTerms = parseSpecific(row.spec);
    const derived = deriveCategories(row.area, row.group, row.spec);

    const updates = { specific_expertise: specificTerms, expertise_embedding: null };

    if (derived.length > 0) {
      updates.expertise = derived;
      updatedCats++;
    } else {
      // No Area/Group/Specific signal — keep the existing broad tags.
      keptCats++;
    }
    if (specificTerms.length > 0) updatedSpec++;

    await profile.update(updates);
    console.log(`✓ ${profile.User.name}`);
    console.log(`    categories: [${(updates.expertise || profile.expertise).join(', ')}]`);
    console.log(`    specific  : [${specificTerms.join(', ') || '—'}]`);
  }

  console.log(`\nDone. ${updatedCats} category sets derived, ${keptCats} kept existing, ${updatedSpec} with specific expertise, ${unmatched} profiles not in sheet (unchanged).`);
  await sequelize.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
