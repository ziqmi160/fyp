import { Submission, User, StudentProfile, ExaminerAssignment, EvaluationForm } from '../models/index.js';
import { Op } from 'sequelize';

export const getDistributedReports = async (req, res) => {
  try {
    const { status, phase, examiner_id } = req.query;
    const whereClause = {};
    
    if (status) whereClause.status = status;
    if (phase) whereClause.phase = phase;
    if (examiner_id) whereClause.examiner_id = examiner_id;

    // For examiners, only show their assigned reports
    if (req.user.role === 'examiner') {
      whereClause.examiner_id = req.user.id;
    }

    const reports = await Submission.findAll({
      where: {
        ...whereClause,
        submission_type: {
          [Op.in]: ['proposal', 'progress_report', 'draft', 'final', 'final_package']
        }
      },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'examiner',
          attributes: ['id', 'name', 'email']
        },
        {
          model: StudentProfile,
          as: 'StudentProfile',
          attributes: ['student_number', 'current_phase']
        }
      ],
      order: [['submitted_at', 'DESC']]
    });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching distributed reports', error: error.message });
  }
};

export const distributeReport = async (req, res) => {
  try {
    const { submission_id, examiner_id, phase } = req.body;

    // Verify submission exists
    const submission = await Submission.findByPk(submission_id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify examiner assignment
    const assignment = await ExaminerAssignment.findOne({
      where: {
        student_id: submission.student_id,
        examiner_id,
        phase: phase || 'CSP600',
        status: 'active'
      }
    });

    if (!assignment) {
      return res.status(400).json({ message: 'No valid examiner assignment found for this student' });
    }

    // Update submission with examiner assignment
    await submission.update({
      examiner_id,
      phase: phase || 'CSP600',
      distribution_status: 'distributed',
      distributed_at: new Date(),
      distributed_by: req.user.id
    });

    const updatedSubmission = await Submission.findByPk(submission_id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'examiner',
          attributes: ['id', 'name', 'email']
        },
        {
          model: StudentProfile,
          as: 'StudentProfile',
          attributes: ['student_number', 'current_phase']
        }
      ]
    });

    res.json(updatedSubmission);
  } catch (error) {
    res.status(500).json({ message: 'Error distributing report', error: error.message });
  }
};

export const getAvailableReports = async (req, res) => {
  try {
    const { phase } = req.query;
    
    // Get submissions that haven't been distributed yet
    const reports = await Submission.findAll({
      where: {
        submission_type: {
          [Op.in]: ['proposal', 'progress_report', 'draft', 'final', 'final_package']
        },
        distribution_status: {
          [Op.or]: [null, 'not_distributed']
        }
      },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        },
        {
          model: StudentProfile,
          as: 'StudentProfile',
          attributes: ['student_number', 'current_phase']
        }
      ],
      order: [['submitted_at', 'DESC']]
    });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available reports', error: error.message });
  }
};

export const getDistributionStats = async (req, res) => {
  try {
    const whereClause = {};
    
    // For examiners, only show their stats
    if (req.user.role === 'examiner') {
      whereClause.examiner_id = req.user.id;
    }

    const stats = await Submission.findAll({
      where: {
        ...whereClause,
        submission_type: {
          [Op.in]: ['proposal', 'progress_report', 'draft', 'final', 'final_package']
        }
      },
      attributes: [
        [Submission.sequelize.fn('COUNT', Submission.sequelize.col('id')), 'total'],
        [Submission.sequelize.fn('COUNT', Submission.sequelize.literal(`CASE WHEN distribution_status = 'distributed' THEN 1 END`)), 'distributed'],
        [Submission.sequelize.fn('COUNT', Submission.sequelize.literal(`CASE WHEN distribution_status = 'reviewed' THEN 1 END`)), 'reviewed'],
      ]
    });

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching distribution stats', error: error.message });
  }
};
