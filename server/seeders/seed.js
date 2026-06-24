import bcrypt from 'bcryptjs';
import { User, StudentProfile, SupervisorProfile, SupervisionRequest, Class, Task } from '../models/index.js';
import { recomputeSupervisorEmbedding } from '../services/embeddingService.js';

const CSP600_TASKS = [
  { title: 'Chapter 1 Submission', description: 'Submit your Chapter 1 document.', order_index: 1 },
  { title: 'Chapter 2 Submission', description: 'Submit your Chapter 2 document.', order_index: 2 },
  { title: 'Chapter 3 Submission', description: 'Submit your Chapter 3 document.', order_index: 3 },
  { title: 'Final Proposal Report', description: 'Submit your complete final proposal report.', order_index: 4 },
];

const CSP650_TASKS = [
  { title: 'Final Report Submission', description: 'Submit your complete final project report.', order_index: 1 },
];

const hashedPassword = bcrypt.hashSync('password123', 10);

// ---------- helpers ----------

function nameToEmail(fullName) {
  const stopWords = new Set(['bin', 'binti', 'bt', 'a/p', 'a/l', 'haji', 'hajah']);
  const parts = fullName.split(/\s+/).filter(p => !stopWords.has(p.toLowerCase()));
  const first = (parts[0] || 'user').toLowerCase().replace(/[^a-z]/g, '');
  const last  = (parts[parts.length - 1] || 'uitm').toLowerCase().replace(/[^a-z]/g, '');
  return `${first}.${last}@uitm.edu.my`;
}

function dedupeEmails(list) {
  const seen = {};
  return list.map(email => {
    if (!seen[email]) { seen[email] = 0; }
    seen[email]++;
    return seen[email] === 1 ? email : email.replace('@', `${seen[email]}@`);
  });
}

function cleanExpertise(raw, area) {
  const junk = new Set(['Not Found', 'NO INFORMATION', 'N/A', 'null', '']);
  const cleaned = raw.filter(e => !junk.has(e.trim()));
  if (cleaned.length) return cleaned.slice(0, 6); // cap at 6 items
  const fallback = (area || '').replace(/null/i, '').trim();
  return fallback ? [fallback.split('(')[0].trim()] : ['Computer Science'];
}

// ---------- supervisor data from Excel ----------

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

// ---------- student data ----------

const studentData = [
  // CSP600 students — 20 students
  { name: 'Ahmad Firdaus Bin Abdullah',   email: 'ahmad.firdaus@student.uitm.edu.my',   matric: '2022810001', programme: 'CS230', group: 'BITP3A', phase: 'CSP600', title: 'AI-Based Traffic Flow Prediction System', description: 'Developing a deep learning model to predict urban traffic congestion using real-time sensor data.' },
  { name: 'Nurul Izzati Binti Mohd Azmi', email: 'nurul.izzati@student.uitm.edu.my',    matric: '2022810002', programme: 'CS230', group: 'BITP3A', phase: 'CSP600', title: 'Sentiment Analysis of Social Media Text', description: 'Using NLP techniques to classify sentiment in Malay and English social media posts.' },
  { name: 'Muhammad Hafiz Bin Hassan',    email: 'muhammad.hafiz@student.uitm.edu.my',  matric: '2022810003', programme: 'CS230', group: 'BITP3A', phase: 'CSP600', title: 'Face Recognition Attendance System', description: 'A contactless attendance tracking system using convolutional neural networks for face recognition.' },
  { name: 'Siti Nurhaliza Binti Ibrahim', email: 'siti.nurhaliza@student.uitm.edu.my',  matric: '2022810004', programme: 'CS230', group: 'BITP3B', phase: 'CSP600', title: 'Smart Home Automation with IoT', description: 'An IoT-based home automation system integrating voice control and mobile app management.' },
  { name: 'Amirul Haqim Bin Zainudin',   email: 'amirul.haqim@student.uitm.edu.my',    matric: '2022810005', programme: 'CS230', group: 'BITP3B', phase: 'CSP600', title: 'Blockchain-Based Academic Certificate Verification', description: 'Leveraging blockchain technology to create tamper-proof digital academic records.' },
  { name: 'Nur Syafiqah Binti Omar',      email: 'nur.syafiqah@student.uitm.edu.my',    matric: '2022810006', programme: 'CS230', group: 'BITP3B', phase: 'CSP600', title: 'Mobile Mental Health Support App', description: 'A cross-platform app providing mood tracking, guided meditation, and peer support features.' },
  { name: 'Mohd Hakimi Bin Rashid',       email: 'mohd.hakimi@student.uitm.edu.my',     matric: '2022810007', programme: 'CS230', group: 'BITP3C', phase: 'CSP600', title: 'Augmented Reality Campus Navigation', description: 'Using AR to overlay directional cues and room information over the smartphone camera view.' },
  { name: 'Fatin Aisyah Binti Kamaruddin',email: 'fatin.aisyah@student.uitm.edu.my',    matric: '2022810008', programme: 'CS230', group: 'BITP3C', phase: 'CSP600', title: 'Predictive Maintenance for Manufacturing Equipment', description: 'Machine learning model to predict equipment failures from vibration and temperature sensor readings.' },
  { name: 'Zulhafiz Bin Hashim',          email: 'zulhafiz.hashim@student.uitm.edu.my', matric: '2022810009', programme: 'CS230', group: 'BITP3C', phase: 'CSP600', title: 'E-Wallet Security Enhancement Using Biometrics', description: 'Integrating fingerprint and facial recognition as multi-factor authentication for mobile payments.' },
  { name: 'Nursyahirah Binti Mohd Noor',  email: 'nursyahirah.noor@student.uitm.edu.my',matric: '2022810010', programme: 'CS230', group: 'BITP3A', phase: 'CSP600', title: 'Automated Essay Scoring System', description: 'NLP model to evaluate and score student essays based on coherence, grammar, and content relevance.' },
  { name: 'Hazwan Bin Azman',             email: 'hazwan.azman@student.uitm.edu.my',     matric: '2022810011', programme: 'IT221', group: 'BITP3D', phase: 'CSP600', title: null, description: null, status: 'no_supervisor' },
  { name: 'Anis Syazwani Binti Alias',    email: 'anis.syazwani@student.uitm.edu.my',    matric: '2022810012', programme: 'IT221', group: 'BITP3D', phase: 'CSP600', title: null, description: null, status: 'no_supervisor' },
  { name: 'Khairul Afiq Bin Mohd Rodzi',  email: 'khairul.afiq@student.uitm.edu.my',     matric: '2022810013', programme: 'IT221', group: 'BITP3D', phase: 'CSP600', title: null, description: null, status: 'pending_approval' },
  { name: 'Nabilah Binti Che Zainal',     email: 'nabilah.zainal@student.uitm.edu.my',   matric: '2022810014', programme: 'IT221', group: 'BITP3E', phase: 'CSP600', title: null, description: null, status: 'pending_approval' },
  { name: 'Faiz Hakimie Bin Jamal',       email: 'faiz.jamal@student.uitm.edu.my',        matric: '2022810015', programme: 'CS230', group: 'BITP3E', phase: 'CSP600', title: 'Deepfake Detection Using CNN', description: 'Building a convolutional neural network to detect AI-generated manipulated video frames.' },
  { name: 'Sofiah Binti Kamarudin',       email: 'sofiah.kamarudin@student.uitm.edu.my',  matric: '2022810016', programme: 'CS230', group: 'BITP3E', phase: 'CSP600', title: 'Crop Disease Detection Mobile App', description: 'Using transfer learning on plant leaf images to diagnose diseases and suggest treatments.' },
  { name: 'Irfan Haziq Bin Rosli',        email: 'irfan.rosli@student.uitm.edu.my',        matric: '2022810017', programme: 'IT221', group: 'BITP3F', phase: 'CSP600', title: null, description: null, status: 'no_supervisor' },
  { name: 'Nadhirah Binti Wahab',         email: 'nadhirah.wahab@student.uitm.edu.my',     matric: '2022810018', programme: 'IT221', group: 'BITP3F', phase: 'CSP600', title: null, description: null, status: 'no_supervisor' },
  { name: 'Harith Bin Othman',            email: 'harith.othman@student.uitm.edu.my',      matric: '2022810019', programme: 'CS230', group: 'BITP3F', phase: 'CSP600', title: 'Network Intrusion Detection Using Deep Learning', description: 'Designing an LSTM-based IDS to detect anomalous network traffic patterns in real time.' },
  { name: 'Khairunnisa Binti Yusoff',     email: 'khairunnisa.yusoff@student.uitm.edu.my', matric: '2022810020', programme: 'CS230', group: 'BITP3A', phase: 'CSP600', title: 'Recommendation System for Online Learning', description: 'Collaborative filtering approach to recommend online courses based on learner history and skill gaps.' },
  // CSP650 students — 10 students
  { name: 'Luqman Hakim Bin Md Nasir',     email: 'luqman.nasir@student.uitm.edu.my',      matric: '2021810001', programme: 'CS230', group: 'BITP4A', phase: 'CSP650', title: 'Smart Waste Management Using Computer Vision', description: 'Real-time waste classification system using YOLOv8 to automate recycling bin sorting.' },
  { name: 'Wan Siti Zulaikha Binti Wan Ahmad', email: 'wansiti.ahmad@student.uitm.edu.my', matric: '2021810002', programme: 'CS230', group: 'BITP4A', phase: 'CSP650', title: 'Sign Language Recognition System', description: 'Real-time Malaysian Sign Language interpretation using MediaPipe hand landmark detection.' },
  { name: 'Mohd Ridhwan Bin Sulaiman',    email: 'mohd.ridhwan@student.uitm.edu.my',       matric: '2021810003', programme: 'CS230', group: 'BITP4B', phase: 'CSP650', title: 'Fraud Detection in Banking Transactions', description: 'Ensemble learning model combining Random Forest and XGBoost for real-time transaction fraud detection.' },
  { name: 'Nurul Ain Binti Mat Isa',      email: 'nurul.ain@student.uitm.edu.my',          matric: '2021810004', programme: 'CS230', group: 'BITP4B', phase: 'CSP650', title: 'Health Monitoring Wearable Dashboard', description: 'Real-time dashboard for visualizing wearable sensor data including heart rate, SpO2, and activity levels.' },
  { name: 'Hafizuddin Bin Abd Hamid',     email: 'hafizuddin.hamid@student.uitm.edu.my',   matric: '2021810005', programme: 'IT221', group: 'BITP4A', phase: 'CSP650', title: 'Automated Code Review Tool', description: 'Static analysis tool with machine learning to detect code smells and suggest improvements.' },
  { name: 'Syafiqah Adibah Binti Saiful', email: 'syafiqah.saiful@student.uitm.edu.my',    matric: '2021810006', programme: 'IT221', group: 'BITP4B', phase: 'CSP650', title: 'Personalized Diet Recommendation App', description: 'Mobile app leveraging user health data and dietary preferences to generate balanced meal plans.' },
  { name: 'Azfar Izzuddin Bin Azmi',      email: 'azfar.azmi@student.uitm.edu.my',         matric: '2021810007', programme: 'CS230', group: 'BITP4A', phase: 'CSP650', title: 'Forest Fire Prediction Using Satellite Imagery', description: 'Applying CNN and satellite thermal images to predict wildfire risk zones in real time.' },
  { name: 'Izzati Binti Shamsuddin',      email: 'izzati.shamsuddin@student.uitm.edu.my',  matric: '2021810008', programme: 'CS230', group: 'BITP4B', phase: 'CSP650', title: 'AI Chatbot for University FAQ', description: 'Transformer-based conversational agent trained on UiTM administrative FAQ data.' },
  { name: 'Razif Bin Zainal Abidin',      email: 'razif.abidin@student.uitm.edu.my',       matric: '2021810009', programme: 'CS230', group: 'BITP4A', phase: 'CSP650', title: 'Indoor Positioning System Using Wi-Fi Fingerprinting', description: 'Machine learning approach to estimate indoor location using RSSI values from Wi-Fi access points.' },
  { name: 'Nabilah Athirah Binti Zulkifli',email:'nabilah.zulkifli@student.uitm.edu.my',   matric: '2021810010', programme: 'IT221', group: 'BITP4B', phase: 'CSP650', title: 'E-Government Service Satisfaction Analysis', description: 'Text mining and sentiment analysis on citizen feedback for government digital services.' },
];

// ---------- seed ----------

async function seed() {
  try {
    console.log('Clearing existing data...');
    await Task.destroy({ where: {} });
    await Class.destroy({ where: {} });
    await User.destroy({ where: {}, force: true });

    // ---- core accounts ----
    console.log('Creating core accounts...');
    const [superAdmin, coord600, coord650] = await User.bulkCreate([
      { name: 'Super Admin',         email: 'superadmin@fyp.com',    password: hashedPassword, role: 'super_admin',  is_active: true, coordinator_phase: null },
      { name: 'Dr. Coordinator CSP600', email: 'coordinator600@fyp.com', password: hashedPassword, role: 'coordinator', is_active: true, coordinator_phase: 'CSP600' },
      { name: 'Dr. Coordinator CSP650', email: 'coordinator650@fyp.com', password: hashedPassword, role: 'coordinator', is_active: true, coordinator_phase: 'CSP650' },
    ]);

    // ---- classes and default tasks ----
    console.log('Creating classes and default tasks...');
    const class600 = await Class.create({ name: '2305A', phase: 'CSP600', coordinator_id: coord600.id, academic_year: '2024/2025 Sem 3', is_active: true });
    const class650 = await Class.create({ name: '2305B', phase: 'CSP650', coordinator_id: coord650.id, academic_year: '2024/2025 Sem 3', is_active: true });
    for (const t of CSP600_TASKS) {
      await Task.create({ ...t, class_id: class600.id, created_by: coord600.id, is_active: true, due_date: new Date('2026-06-30') });
    }
    for (const t of CSP650_TASKS) {
      await Task.create({ ...t, class_id: class650.id, created_by: coord650.id, is_active: true, due_date: new Date('2026-06-30') });
    }

    // ---- supervisors ----
    console.log('Creating supervisor accounts...');
    const rawEmails = supervisorData.map(s => nameToEmail(s.name));
    const dedupedEmails = dedupeEmails(rawEmails);

    const supervisorUserRows = supervisorData.map((s, i) => ({
      name: s.name,
      email: dedupedEmails[i],
      password: hashedPassword,
      role: 'supervisor',
      is_active: true,
      approval_status: 'approved',
    }));

    const supervisorUsers = await User.bulkCreate(supervisorUserRows);

    console.log('Creating supervisor profiles...');
    const supervisorProfileRows = supervisorData.map((s, i) => ({
      user_id: supervisorUsers[i].id,
      staff_id: `CS${String(i + 1).padStart(3, '0')}`,
      expertise: cleanExpertise(s.expertise, ''),
      max_students: 5,
      current_student_count: 0,
      is_accepting: true,
    }));

    const supervisorProfiles = await SupervisorProfile.bulkCreate(supervisorProfileRows);

    // compute NLP embeddings
    console.log(`Computing NLP embeddings for ${supervisorProfiles.length} supervisors...`);
    for (let i = 0; i < supervisorProfiles.length; i++) {
      process.stdout.write(`\r  ${i + 1}/${supervisorProfiles.length}`);
      await recomputeSupervisorEmbedding(supervisorProfiles[i]);
    }
    console.log('\nEmbeddings done.');

    // ---- students ----
    console.log('Creating student accounts...');
    const studentUsers = await User.bulkCreate(
      studentData.map(s => ({
        name: s.name,
        email: s.email,
        password: hashedPassword,
        role: 'student',
        is_active: true,
      }))
    );

    // Assign supervisors for students that have a title
    // Distribute evenly across the first 20 supervisors
    let supIdx = 0;
    const studentProfileRows = studentData.map((s, i) => {
      const hasTitle = !!s.title;
      const status = s.status || (hasTitle ? 'active' : 'no_supervisor');
      let supervisorId = null;
      if (hasTitle) {
        supervisorId = supervisorUsers[supIdx % 20].id;
        supIdx++;
      }
      return {
        user_id: studentUsers[i].id,
        student_id: s.matric,
        programme: s.programme,
        group_name: s.group,
        current_phase: s.phase,
        fyp_title: s.title || null,
        fyp_status: status,
        project_description: s.description || null,
        current_supervisor_id: supervisorId,
        class_id: s.phase === 'CSP650' ? class650.id : class600.id,
      };
    });

    await StudentProfile.bulkCreate(studentProfileRows);

    // Fix supervisor current_student_count to match actual assignments
    const supervisorCounts = {};
    for (const row of studentProfileRows) {
      if (row.current_supervisor_id) {
        supervisorCounts[row.current_supervisor_id] = (supervisorCounts[row.current_supervisor_id] || 0) + 1;
      }
    }
    for (const [userId, count] of Object.entries(supervisorCounts)) {
      await SupervisorProfile.update({ current_student_count: count }, { where: { user_id: userId } });
    }

    // supervision requests for no_supervisor students
    const noSupStudents = studentData
      .map((s, i) => ({ s, user: studentUsers[i] }))
      .filter(({ s }) => (s.status || '') === 'no_supervisor');

    if (noSupStudents.length) {
      await SupervisionRequest.bulkCreate(
        noSupStudents.map(({ user }, i) => ({
          student_id: user.id,
          supervisor_id: supervisorUsers[(i + 5) % supervisorUsers.length].id,
          title_proposed: 'To be determined',
          message: 'I am looking for a supervisor for my final year project.',
          status: 'pending',
        }))
      );
    }

    console.log('\n========================================');
    console.log('Seed complete!');
    console.log('========================================');
    console.log('\nCore accounts (password: password123)');
    console.log('  superadmin@fyp.com       – super_admin');
    console.log('  coordinator600@fyp.com   – coordinator (CSP600)');
    console.log('  coordinator650@fyp.com   – coordinator (CSP650)');
    console.log('\nSupervisors (password: password123)');
    supervisorData.forEach((s, i) => console.log(`  ${dedupedEmails[i].padEnd(40)} – ${s.name}`));
    console.log(`\nStudents created: ${studentData.length}`);
    console.log('  CSP600:', studentData.filter(s => s.phase === 'CSP600').length);
    console.log('  CSP650:', studentData.filter(s => s.phase === 'CSP650').length);
    console.log('  password for all students: password123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
