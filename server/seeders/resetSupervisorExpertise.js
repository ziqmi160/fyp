// Non-destructive: reset each supervisor's expertise to the 10-category seed
// values, matched by name. Unlike seed.js this does NOT wipe users or any other
// data — it only updates SupervisorProfile.expertise (and clears the cached
// embedding so NLP matching recomputes).
//
// Run: node server/seeders/resetSupervisorExpertise.js
import sequelize from '../config/database.js';
import { User, SupervisorProfile } from '../models/index.js';

const MAPPING = {
  "Azlan Bin Ismail": [
    "Software Engineering",
    "Data Science & Analytics",
    "Machine Learning & Deep Learning"
  ],
  "Marshima Binti Mohd Rosli": [
    "Software Engineering",
    "Machine Learning & Deep Learning",
    "Data Science & Analytics"
  ],
  "Noraini Binti Seman": [
    "Natural Language Processing",
    "Machine Learning & Deep Learning",
    "Data Science & Analytics"
  ],
  "Norhaslinda Binti Kamaruddin": [
    "Machine Learning & Deep Learning",
    "Natural Language Processing",
    "Artificial Intelligence",
    "Data Science & Analytics"
  ],
  "Norizan Binti Mat Diah": [
    "Learning Technology & HCI",
    "Machine Learning & Deep Learning"
  ],
  "Nur Atiqah Sia Binti Abdullah": [
    "Software Engineering",
    "Data Science & Analytics",
    "Natural Language Processing"
  ],
  "Shafaf Ibrahim": [
    "Software Engineering"
  ],
  "Suriyani Binti Ariffin": [
    "Cybersecurity & Cryptography"
  ],
  "Hafizatul Hanin Binti Hamzah": [
    "Software Engineering"
  ],
  "Hana Fakhira Binti Almarzuki": [
    "Software Engineering"
  ],
  "Afiza Binti Ismail": [
    "Software Engineering"
  ],
  "Ali Bin Seman": [
    "Artificial Intelligence",
    "Data Science & Analytics"
  ],
  "Haslizatul Fairuz Binti Mohamed Hanum": [
    "Natural Language Processing",
    "Information Systems & Database"
  ],
  "Hayati Binti Abdul Rahman": [
    "Learning Technology & HCI"
  ],
  "Mohd Suffian Bin Sulaiman": [
    "Software Engineering",
    "Artificial Intelligence",
    "Computer Vision & Image Processing"
  ],
  "Muhammad Amir Khan": [
    "Machine Learning & Deep Learning",
    "Computer Vision & Image Processing",
    "Natural Language Processing",
    "Data Science & Analytics"
  ],
  "Muhammad Izzad Bin Ramli": [
    "Machine Learning & Deep Learning",
    "Web & Mobile Development"
  ],
  "Noor Latiffah Binti Adam": [
    "Information Systems & Database",
    "Natural Language Processing"
  ],
  "Nor Ashikin Binti Mohamad Kamal": [
    "Machine Learning & Deep Learning",
    "Computer Vision & Image Processing",
    "Data Science & Analytics"
  ],
  "Norzilah Binti Musa": [
    "Web & Mobile Development",
    "Learning Technology & HCI"
  ],
  "Nur Farraliza Binti Mansor": [
    "Software Engineering"
  ],
  "Prasanna A/P Ramakrisnan": [
    "Learning Technology & HCI",
    "Data Science & Analytics"
  ],
  "Razulaimi Bin Razali": [
    "Machine Learning & Deep Learning",
    "Software Engineering",
    "Artificial Intelligence"
  ],
  "Shakirah Binti Hashim": [
    "Software Engineering"
  ],
  "Sharifah Binti Aliman": [
    "Information Systems & Database"
  ],
  "Sharifalillah Binti Nordin": [
    "Information Systems & Database"
  ],
  "Siti Khatijah Nor Binti Abdul Rahim": [
    "Artificial Intelligence",
    "Software Engineering"
  ],
  "Suzana Binti Ahmad": [
    "Information Systems & Database"
  ],
  "Syed Mohd Zahid Bin Syed Zainal Ariffin": [
    "Computer Vision & Image Processing"
  ],
  "Tajul Rosli Bin Razak": [
    "Artificial Intelligence"
  ],
  "Tengku Zatul Hidayah Binti Tengku Petra": [
    "Software Engineering"
  ],
  "Zainura Binti Idrus": [
    "Learning Technology & HCI",
    "Data Science & Analytics"
  ],
  "Waheed Yasin Mohammed Abdul-Wahid": [
    "Software Engineering"
  ],
  "Ahmad Taufiq Bin Haji Mohamad": [
    "Machine Learning & Deep Learning",
    "Data Science & Analytics"
  ],
  "Azizian Bin Mohd Sapawi": [
    "Information Systems & Database"
  ],
  "Muhamad Ridhwan Bin Mohamad Razali": [
    "Machine Learning & Deep Learning",
    "Data Science & Analytics"
  ],
  "Syamsulhairi Bin Yaakop": [
    "Information Systems & Database"
  ],
  "Norasiah Binti Mohammaddr": [
    "Natural Language Processing"
  ],
  "Nurul Hijja Binti Mazlan": [
    "Learning Technology & HCI",
    "Artificial Intelligence"
  ],
  "Ahmad Faiz Ghazali": [
    "Software Engineering"
  ],
  "Mohd Nor Hajar Hasrol Jono": [
    "Software Engineering"
  ],
  "Ismadi Bin Md Badarudin": [
    "Artificial Intelligence",
    "Information Systems & Database"
  ]
};

async function run() {
  await sequelize.authenticate();
  // case-insensitive name lookup
  const byLower = {};
  for (const [name, exp] of Object.entries(MAPPING)) byLower[name.trim().toLowerCase()] = exp;

  const profiles = await SupervisorProfile.findAll({
    include: [{ model: User, attributes: ['id', 'name'] }],
  });

  let updated = 0, skipped = 0;
  const unmatched = [];
  for (const profile of profiles) {
    const name = (profile.User?.name || '').trim().toLowerCase();
    const exp = byLower[name];
    if (!exp) { unmatched.push(profile.User?.name || `profile#${profile.id}`); skipped++; continue; }
    await profile.update({ expertise: exp, expertise_embedding: null });
    updated++;
    console.log(`✓ ${profile.User.name} -> [${exp.join(', ')}]`);
  }

  console.log(`\nUpdated ${updated}, skipped ${skipped} (no name match — left unchanged).`);
  if (unmatched.length) { console.log('Left unchanged:'); unmatched.forEach(n => console.log('  -', n)); }
  await sequelize.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
