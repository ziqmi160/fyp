import { Deliverable, Submission, User } from '../models/index.js';

export const uploadDeliverable = async (req, res) => {
  try {
    const { submission_id, type } = req.body;
    const student_id = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    if (!type) {
      return res.status(400).json({ success: false, error: 'Deliverable type is required.' });
    }

    // Verify submission belongs to student
    const submission = await Submission.findByPk(submission_id);
    if (!submission || submission.student_id !== student_id) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const deliverable = await Deliverable.create({
      submission_id,
      student_id,
      type,
      file_path: req.file.path,
      file_size: req.file.size
    });

    res.status(201).json({
      success: true,
      data: deliverable,
      message: 'Deliverable uploaded successfully.'
    });
  } catch (error) {
    console.error('Upload deliverable error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getDeliverables = async (req, res) => {
  try {
    const { submission_id } = req.params;

    const deliverables = await Deliverable.findAll({
      where: { submission_id },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['type', 'ASC']]
    });

    res.json({
      success: true,
      data: deliverables
    });
  } catch (error) {
    console.error('Get deliverables error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getMyDeliverables = async (req, res) => {
  try {
    const { submission_id } = req.params;
    const student_id = req.user.id;

    const submission = await Submission.findByPk(submission_id);
    if (!submission || submission.student_id !== student_id) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const deliverables = await Deliverable.findAll({
      where: { submission_id, student_id },
      order: [['type', 'ASC']]
    });

    // Get checklist of required deliverables
    const deliverableTypes = ['report_pdf', 'report_docx', 'slides', 'poster', 'raw_data', 'system_files', 'apk_exe'];
    const checklist = deliverableTypes.map(type => ({
      type,
      submitted: deliverables.some(d => d.type === type),
      file: deliverables.find(d => d.type === type) || null
    }));

    res.json({
      success: true,
      data: {
        deliverables,
        checklist,
        completionPercentage: Math.round((deliverables.length / deliverableTypes.length) * 100)
      }
    });
  } catch (error) {
    console.error('Get my deliverables error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const deleteDeliverable = async (req, res) => {
  try {
    const { id } = req.params;
    const student_id = req.user.id;

    const deliverable = await Deliverable.findByPk(id);
    if (!deliverable) {
      return res.status(404).json({ success: false, error: 'Deliverable not found.' });
    }

    if (deliverable.student_id !== student_id && req.user.role !== 'coordinator') {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    await deliverable.destroy();

    res.json({
      success: true,
      message: 'Deliverable deleted.'
    });
  } catch (error) {
    console.error('Delete deliverable error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getSubmissionDeliverableStatus = async (req, res) => {
  try {
    const { submission_id } = req.params;

    const submission = await Submission.findByPk(submission_id, {
      include: [
        {
          model: Deliverable,
          attributes: ['type', 'uploaded_at']
        }
      ]
    });

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found.' });
    }

    const deliverableTypes = ['report_pdf', 'report_docx', 'slides', 'poster', 'raw_data', 'system_files', 'apk_exe'];
    const checklist = deliverableTypes.map(type => ({
      type,
      submitted: submission.Deliverables.some(d => d.type === type)
    }));

    res.json({
      success: true,
      data: {
        submission_id,
        checklist,
        totalDeliverables: submission.Deliverables.length,
        requiredDeliverables: deliverableTypes.length,
        completionPercentage: Math.round((submission.Deliverables.length / deliverableTypes.length) * 100),
        complete: submission.Deliverables.length === deliverableTypes.length
      }
    });
  } catch (error) {
    console.error('Get submission deliverable status error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
