import path from 'path';
import { fileURLToPath } from 'url';
import { F6Form, Submission, StudentProfile, User } from '../models/index.js';
import { generateF6Form } from '../services/pdfService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /f6/:submissionId — get or create F6 record for a final submission
export const getOrCreateF6 = async (req, res) => {
  try {
    const submission = await Submission.findByPk(req.params.submissionId, {
      include: [{ model: User, as: 'student', attributes: ['id', 'name'] }]
    });
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found.' });
    if (submission.submission_type !== 'final') {
      return res.status(400).json({ success: false, error: 'F6 is only for final submissions.' });
    }
    if (submission.supervisor_id !== req.user.id && req.user.role !== 'coordinator') {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const profile = await StudentProfile.findOne({ where: { user_id: submission.student_id } });
    const phase = profile?.current_phase || 'CSP600';

    const [f6, created] = await F6Form.findOrCreate({
      where: { submission_id: submission.id },
      defaults: {
        student_id: submission.student_id,
        supervisor_id: submission.supervisor_id,
        phase,
      }
    });

    res.json({ success: true, data: f6 });
  } catch (error) {
    console.error('Get/create F6 error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// PUT /f6/:submissionId — supervisor updates SI%, AI%, handover_date
export const updateF6Data = async (req, res) => {
  try {
    const submission = await Submission.findByPk(req.params.submissionId);
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found.' });
    if (submission.supervisor_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const f6 = await F6Form.findOne({ where: { submission_id: submission.id } });
    if (!f6) return res.status(404).json({ success: false, error: 'F6 record not found. Load it first.' });

    const { similarity_index, ai_index, handover_date } = req.body;
    const updates = {};
    if (similarity_index !== undefined) updates.similarity_index = similarity_index;
    if (ai_index !== undefined) updates.ai_index = ai_index;
    if (handover_date !== undefined) updates.handover_date = handover_date;

    await f6.update(updates);
    res.json({ success: true, data: f6, message: 'F6 data saved.' });
  } catch (error) {
    console.error('Update F6 error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// POST /f6/:submissionId/sign — supervisor signs the F6
export const signF6 = async (req, res) => {
  try {
    const submission = await Submission.findByPk(req.params.submissionId);
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found.' });
    if (submission.supervisor_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const signer = await User.findByPk(req.user.id, { attributes: ['id', 'signature'] });
    if (!signer.signature) {
      return res.status(400).json({ success: false, error: 'No signature set. Please save your signature in Settings first.' });
    }

    const f6 = await F6Form.findOne({ where: { submission_id: submission.id } });
    if (!f6) return res.status(404).json({ success: false, error: 'F6 record not found.' });

    await f6.update({
      supervisor_signature_img: signer.signature,
      supervisor_signed_at: new Date(),
    });
    res.json({ success: true, data: f6, message: 'F6 signed.' });
  } catch (error) {
    console.error('Sign F6 error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// POST /f6/:submissionId/generate — coordinator generates F6 PDF
export const generateF6PDF = async (req, res) => {
  try {
    const submission = await Submission.findByPk(req.params.submissionId, {
      include: [{ model: User, as: 'student', attributes: ['id', 'name'] }]
    });
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found.' });

    const f6 = await F6Form.findOne({ where: { submission_id: submission.id } });
    if (!f6) return res.status(404).json({ success: false, error: 'F6 record not found. The supervisor must fill it in first.' });

    const studentProfile = await StudentProfile.findOne({ where: { user_id: submission.student_id } });
    const supervisor = await User.findByPk(submission.supervisor_id, { attributes: ['id', 'name'] });
    const studentUser = await User.findByPk(submission.student_id, { attributes: ['id', 'name', 'signature'] });

    const relativePath = await generateF6Form({
      f6,
      student: { id: studentUser.id, name: studentUser.name, signature: studentUser.signature },
      studentProfile: {
        student_id: studentProfile?.student_id,
        programme: studentProfile?.programme,
      },
      supervisorName: supervisor?.name || '',
      projectTitle: studentProfile?.fyp_title || submission.title || '',
    });

    await f6.update({ document_path: relativePath });

    const filePath = path.join(__dirname, '../uploads', relativePath);
    const label = f6.phase === 'CSP650' ? 'F6b' : 'F6a';
    res.download(filePath, `${label}_${studentUser.name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Generate F6 PDF error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// POST /f6/student/:userId/generate — coordinator generates F6 PDF by student user ID
export const generateF6PDFByStudent = async (req, res) => {
  try {
    const submission = await Submission.findOne({
      where: { student_id: req.params.userId, submission_type: 'final' },
      order: [['submitted_at', 'DESC']],
    });
    if (!submission) {
      return res.status(404).json({ success: false, error: 'No final submission found for this student.' });
    }

    const f6 = await F6Form.findOne({ where: { submission_id: submission.id } });
    if (!f6) {
      return res.status(404).json({ success: false, error: 'F6 record not found. The supervisor must fill it in first.' });
    }

    const studentProfile = await StudentProfile.findOne({ where: { user_id: submission.student_id } });
    const supervisor = await User.findByPk(submission.supervisor_id, { attributes: ['id', 'name'] });
    const studentUser = await User.findByPk(submission.student_id, { attributes: ['id', 'name', 'signature'] });

    const relativePath = await generateF6Form({
      f6,
      student: { id: studentUser.id, name: studentUser.name, signature: studentUser.signature },
      studentProfile: {
        student_id: studentProfile?.student_id,
        programme: studentProfile?.programme,
      },
      supervisorName: supervisor?.name || '',
      projectTitle: studentProfile?.fyp_title || submission.title || '',
    });

    await f6.update({ document_path: relativePath });

    const filePath = path.join(__dirname, '../uploads', relativePath);
    const label = f6.phase === 'CSP650' ? 'F6b' : 'F6a';
    res.download(filePath, `${label}_${studentUser.name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Generate F6 by student error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
