import { PlagiarismCheck, Submission } from '../models/index.js';

export const uploadPlagiarismCheck = async (req, res) => {
  try {
    const { submission_id } = req.params;
    const student_id = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    // Verify submission belongs to student
    const submission = await Submission.findByPk(submission_id);
    if (!submission || submission.student_id !== student_id) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    // Check if plagiarism check already exists
    let plagiarismCheck = await PlagiarismCheck.findOne({
      where: { submission_id }
    });

    if (plagiarismCheck) {
      // Update existing record
      plagiarismCheck = await plagiarismCheck.update({
        report_file: req.file.path,
        file_size: req.file.size,
        status: 'pending'
      });
    } else {
      // Create new record
      plagiarismCheck = await PlagiarismCheck.create({
        submission_id,
        student_id,
        report_file: req.file.path,
        file_size: req.file.size,
        status: 'pending'
      });
    }

    res.json({
      success: true,
      data: plagiarismCheck,
      message: 'Plagiarism check uploaded. Awaiting coordinator review.'
    });
  } catch (error) {
    console.error('Upload plagiarism check error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getPlagiarismChecks = async (req, res) => {
  try {
    const { status, phase_id } = req.query;
    const where = {};

    if (status) where.status = status;

    let checks = await PlagiarismCheck.findAll({
      where,
      include: [
        {
          model: Submission,
          attributes: ['id', 'type', 'phase_id', 'submitted_at']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Filter by phase if provided
    if (phase_id) {
      checks = checks.filter(c => c.Submission?.phase_id === parseInt(phase_id));
    }

    res.json({
      success: true,
      data: checks
    });
  } catch (error) {
    console.error('Get plagiarism checks error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const reviewPlagiarismCheck = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, similarity_percentage, coordinator_notes } = req.body;

    const plagarismCheck = await PlagiarismCheck.findByPk(id);
    if (!plagarismCheck) {
      return res.status(404).json({ success: false, error: 'Plagiarism check not found.' });
    }

    await plagarismCheck.update({
      status,
      similarity_percentage,
      coordinator_notes,
      checked_at: new Date()
    });

    res.json({
      success: true,
      data: plagarismCheck,
      message: 'Plagiarism check reviewed.'
    });
  } catch (error) {
    console.error('Review plagiarism check error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getMyPlagiarismChecks = async (req, res) => {
  try {
    const student_id = req.user.id;

    const checks = await PlagiarismCheck.findAll({
      where: { student_id },
      include: [
        {
          model: Submission,
          attributes: ['id', 'type', 'submitted_at']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: checks
    });
  } catch (error) {
    console.error('Get my plagiarism checks error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
