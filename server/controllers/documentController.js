import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { OfficialDocument, User, StudentProfile, SupervisorProfile } from '../models/index.js';
import { generateMutualAcceptance } from '../services/pdfService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fetch or generate the F1 form for a student.
// If the OfficialDocument record already exists and the file is on disk, return it.
// If the record is missing but the student has an active supervisor, generate a fresh one.
export async function getOrCreateF1(studentUserId) {
  // Check for existing record with a valid file
  const existing = await OfficialDocument.findOne({
    where: { student_id: studentUserId, document_type: 'mutual_acceptance' },
    order: [['generated_at', 'DESC']]
  });

  if (existing) {
    const filePath = path.join(__dirname, '../uploads', existing.file_path);
    if (fs.existsSync(filePath)) return existing;
    // Record exists but file is gone — fall through to regenerate
  }

  // Need to generate: fetch student profile + supervisor
  const studentProfile = await StudentProfile.findOne({
    where: { user_id: studentUserId },
    include: [
      { model: User, as: 'studentUser', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'supervisor', attributes: ['id', 'name', 'email'] }
    ]
  });

  if (!studentProfile?.current_supervisor_id) {
    return null; // No supervisor — can't generate
  }

  const student = studentProfile.studentUser;
  const supervisor = studentProfile.supervisor;

  const pdfPath = await generateMutualAcceptance({
    student: { id: student.id, name: student.name, email: student.email },
    supervisor: { id: supervisor.id, name: supervisor.name, email: supervisor.email },
    title: studentProfile.fyp_title || '',
    date: new Date(),
    studentProfile: { student_id: studentProfile.student_id, programme: studentProfile.programme }
  });

  const doc = await OfficialDocument.create({
    student_id: studentUserId,
    supervisor_id: supervisor.id,
    document_type: 'mutual_acceptance',
    file_path: pdfPath
  });

  return doc;
}

export const getMyDocuments = async (req, res) => {
  try {
    const where = req.user.role === 'student'
      ? { student_id: req.user.id }
      : { supervisor_id: req.user.id };

    const docs = await OfficialDocument.findAll({
      where,
      order: [['generated_at', 'DESC']]
    });

    res.json({ success: true, data: docs });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// Student: get (or generate) their own F1 form
export const getMyF1 = async (req, res) => {
  try {
    const doc = await getOrCreateF1(req.user.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'No active supervisor found. F1 form cannot be generated.' });
    }
    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Get F1 error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// Coordinator: get (or generate) F1 for a specific student
export const getStudentF1 = async (req, res) => {
  try {
    const doc = await getOrCreateF1(parseInt(req.params.studentUserId));
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Student has no active supervisor. F1 form cannot be generated.' });
    }
    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Get student F1 error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const downloadDocument = async (req, res) => {
  try {
    const doc = await OfficialDocument.findByPk(req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    const isOwner = doc.student_id === req.user.id || doc.supervisor_id === req.user.id;
    const isCoordinator = req.user.role === 'coordinator';

    if (!isOwner && !isCoordinator) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const filePath = path.join(__dirname, '../uploads', doc.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found on disk.' });
    }

    res.download(filePath, path.basename(doc.file_path));
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
