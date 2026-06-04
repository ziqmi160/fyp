import path from 'path';
import { Submission, SubmissionAttachment, StudentProfile, User } from '../models/index.js';
import { createNotification } from './notificationController.js';

export const createSubmission = async (req, res) => {
  try {
    const { title, submission_type, description, external_link, task_id } = req.body;
    const studentId = req.user.id;

    const studentProfile = await StudentProfile.findOne({ where: { user_id: studentId } });
    if (!studentProfile || !studentProfile.current_supervisor_id) {
      return res.status(400).json({ success: false, error: 'You need an active supervisor to submit.' });
    }

    const submission = await Submission.create({
      student_id: studentId,
      supervisor_id: studentProfile.current_supervisor_id,
      title,
      submission_type: submission_type || 'progress_report',
      description: description || null,
      external_link: external_link || null,
      task_id: task_id ? parseInt(task_id) : null,
      submitted_at: new Date()
    });

    if (req.files && req.files.length > 0) {
      const attachments = req.files.map(f => {
        const pathParts = f.path.replace(/\\/g, '/').split('/');
        const relPath = pathParts.slice(pathParts.indexOf('uploads') + 1).join('/');
        return {
          submission_id: submission.id,
          file_name: f.originalname,
          file_path: relPath,
          file_type: f.mimetype,
          file_size: f.size
        };
      });
      await SubmissionAttachment.bulkCreate(attachments);
    }

    await createNotification(studentProfile.current_supervisor_id, 'New Submission', `${req.user.name} submitted: ${title} (${submission_type})`, 'info', submission.id, 'submission');

    const fullSubmission = await Submission.findByPk(submission.id, {
      include: [SubmissionAttachment]
    });

    res.status(201).json({
      success: true,
      data: fullSubmission,
      message: 'Submission created.'
    });
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.findAll({
      where: { student_id: req.user.id },
      include: [SubmissionAttachment],
      order: [['submitted_at', 'DESC']]
    });

    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Get my submissions error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getPendingSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.findAll({
      where: { supervisor_id: req.user.id, status: 'pending' },
      include: [
        SubmissionAttachment,
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] }
      ],
      order: [['submitted_at', 'DESC']]
    });

    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Get pending submissions error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findByPk(req.params.id, {
      include: [
        SubmissionAttachment,
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'supervisor', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found.' });
    }

    const isStudent = submission.student_id === req.user.id;
    const isSupervisor = submission.supervisor_id === req.user.id;

    if (!isStudent && !isSupervisor) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    res.json({ success: true, data: submission });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const uploadSignedReport = async (req, res) => {
  try {
    const submission = await Submission.findByPk(req.params.id);

    if (!submission || submission.supervisor_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Submission not found.' });
    }

    if (!['final', 'F6b'].includes(submission.submission_type)) {
      return res.status(400).json({ success: false, error: 'Signed report upload is only for final/F6b submissions.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    const pathParts = req.file.path.replace(/\\/g, '/').split('/');
    const relPath = pathParts.slice(pathParts.indexOf('uploads') + 1).join('/');

    await submission.update({
      supervisor_signed_report_path: relPath,
      supervisor_report_approved_at: new Date()
    });

    await createNotification(
      submission.student_id,
      'Supervisor Signed Report Uploaded',
      `Your supervisor has uploaded the signed Supervisor Approval page for "${submission.title}".`,
      'success',
      submission.id,
      'submission'
    );

    res.json({ success: true, data: submission, message: 'Signed report uploaded.' });
  } catch (error) {
    console.error('Upload signed report error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const reviewSubmission = async (req, res) => {
  try {
    const { supervisor_feedback, status } = req.body;

    if (!['approved', 'revision_required'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status. Use approved or revision_required.' });
    }

    const submission = await Submission.findByPk(req.params.id);

    if (!submission || submission.supervisor_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Submission not found.' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Submission already reviewed.' });
    }

    await submission.update({
      supervisor_feedback: supervisor_feedback || null,
      status,
      reviewed_at: new Date()
    });

    await createNotification(submission.student_id, 'Submission Reviewed', `Your submission "${submission.title}" has been ${status.replace('_', ' ')}.`, status === 'approved' ? 'success' : 'warning', submission.id, 'submission');

    res.json({
      success: true,
      data: submission,
      message: 'Review submitted.'
    });
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
