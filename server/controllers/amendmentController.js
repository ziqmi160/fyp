import { Amendment, User, StudentProfile, PresentationSlot, EvaluationForm, Submission } from '../models/index.js';
import { Op } from 'sequelize';

export const getAmendments = async (req, res) => {
  try {
    const { status, student_id, phase } = req.query;
    const whereClause = {};
    
    if (status) whereClause.f12_status = status;
    if (student_id) whereClause.student_id = student_id;
    if (phase) whereClause.phase = phase;

    // Filter by user role
    if (req.user.role === 'student') {
      whereClause.student_id = req.user.id;
    } else if (req.user.role === 'supervisor') {
      // Get students supervised by this user
      const supervisedStudents = await StudentProfile.findAll({
        where: { current_supervisor_id: req.user.id },
        attributes: ['user_id']
      });
      whereClause.student_id = {
        [Op.in]: supervisedStudents.map(s => s.user_id)
      };
    }

    const amendments = await Amendment.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(amendments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching amendments', error: error.message });
  }
};

export const createAmendment = async (req, res) => {
  try {
    const { 
      student_id, 
      presentation_slot_id, 
      amendment_type, 
      description, 
      deadline_date,
      phase 
    } = req.body;

    // Verify the presentation slot exists and is completed
    const presentationSlot = await PresentationSlot.findByPk(presentation_slot_id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'supervisor',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'examiner',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!presentationSlot) {
      return res.status(404).json({ message: 'Presentation slot not found' });
    }

    if (presentationSlot.status !== 'completed') {
      return res.status(400).json({ message: 'Amendments can only be created for completed presentations' });
    }

    // Get the student's latest submission
    const submission = await Submission.findOne({
      where: { student_id: presentationSlot.student_id },
      order: [['created_at', 'DESC']]
    });

    if (!submission) {
      return res.status(404).json({ message: 'No submission found for this student' });
    }

    const amendment = await Amendment.create({
      student_id: presentationSlot.student_id,
      submission_id: submission.id,
      evaluator_id: presentationSlot.examiner_id,
      amendment_type,
      original_feedback: description,
      f12_status: 'pending'
    });

    const createdAmendment = await Amendment.findByPk(amendment.id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json(createdAmendment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating amendment', error: error.message });
  }
};

export const updateAmendment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amended_submission_id, f12_form_data } = req.body;

    const amendment = await Amendment.findByPk(id);
    if (!amendment) {
      return res.status(404).json({ message: 'Amendment not found' });
    }

    if (amendment.f12_status === 'completed') {
      return res.status(400).json({ message: 'Cannot update a completed amendment' });
    }

    const updateData = {};
    if (amended_submission_id) {
      updateData.amended_submission_id = amended_submission_id;
    }
    if (f12_form_data) {
      updateData.f12_form_data = f12_form_data;
    }

    await amendment.update(updateData);

    const updatedAmendment = await Amendment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(updatedAmendment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating amendment', error: error.message });
  }
};

export const deleteAmendment = async (req, res) => {
  try {
    const { id } = req.params;
    const amendment = await Amendment.findByPk(id);
    
    if (!amendment) {
      return res.status(404).json({ message: 'Amendment not found' });
    }

    if (amendment.f12_status !== 'pending') {
      return res.status(400).json({ message: 'Can only delete pending amendments' });
    }

    await amendment.destroy();
    res.json({ message: 'Amendment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting amendment', error: error.message });
  }
};

export const submitF12Form = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      corrections_made, 
      additional_changes, 
      student_declaration, 
      supervisor_signature,
      examiner_signature 
    } = req.body;

    const amendment = await Amendment.findByPk(id);
    if (!amendment) {
      return res.status(404).json({ message: 'Amendment not found' });
    }

    if (amendment.f12_status !== 'pending') {
      return res.status(400).json({ message: 'F12 form can only be submitted for pending amendments' });
    }

    const f12Data = {
      corrections_made,
      additional_changes,
      student_declaration,
      supervisor_signature,
      examiner_signature,
      submitted_at: new Date()
    };

    await amendment.update({
      f12_form_data: f12Data,
      updated_by: req.user.id
    });

    const updatedAmendment = await Amendment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(updatedAmendment);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting F12 form', error: error.message });
  }
};

export const approveF12Form = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, comments } = req.body; // role: 'supervisor' or 'examiner'

    const amendment = await Amendment.findByPk(id);
    if (!amendment) {
      return res.status(404).json({ message: 'Amendment not found' });
    }

    if (amendment.f12_status === 'completed') {
      return res.status(400).json({ message: 'This amendment is already completed' });
    }

    if (amendment.f12_status === 'pending') {
      return res.status(400).json({ message: 'F12 form must be submitted before approval' });
    }

    const f12Data = amendment.f12_form_data || {};
    
    if (role === 'supervisor') {
      f12Data.supervisor_approval = {
        approved: true,
        approved_at: new Date(),
        approved_by: req.user.id,
        comments
      };
      amendment.supervisor_signature = f12Data.supervisor_approval;
      amendment.supervisor_signed_at = new Date();
    } else if (role === 'examiner') {
      f12Data.examiner_approval = {
        approved: true,
        approved_at: new Date(),
        approved_by: req.user.id,
        comments
      };
      amendment.examiner_signature = f12Data.examiner_approval;
      amendment.examiner_signed_at = new Date();
    }

    // Determine new status based on current state and who's approving
    let newStatus = amendment.f12_status;
    if (amendment.f12_status === 'examiner_approved' && role === 'supervisor') {
      newStatus = 'completed';
    } else if (amendment.f12_status === 'supervisor_approved' && role === 'examiner') {
      newStatus = 'completed';
    } else if (amendment.f12_status === 'pending' || amendment.f12_status === 'examiner_approved' || amendment.f12_status === 'supervisor_approved') {
      // First approval
      if (role === 'examiner') {
        newStatus = 'examiner_approved';
      } else if (role === 'supervisor') {
        newStatus = 'supervisor_approved';
      }
    }

    await amendment.update({
      f12_form_data: f12Data,
      f12_status: newStatus,
      completed_at: newStatus === 'completed' ? new Date() : amendment.completed_at,
      updated_by: req.user.id
    });

    const updatedAmendment = await Amendment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(updatedAmendment);
  } catch (error) {
    res.status(500).json({ message: 'Error approving F12 form', error: error.message });
  }
};

export const getAmendmentStats = async (req, res) => {
  try {
    const whereClause = {};
    
    // Filter by user role
    if (req.user.role === 'student') {
      whereClause.student_id = req.user.id;
    } else if (req.user.role === 'supervisor') {
      const supervisedStudents = await StudentProfile.findAll({
        where: { current_supervisor_id: req.user.id },
        attributes: ['user_id']
      });
      whereClause.student_id = {
        [Op.in]: supervisedStudents.map(s => s.user_id)
      };
    }

    const stats = await Amendment.findAll({
      where: whereClause,
      attributes: [
        [Amendment.sequelize.fn('COUNT', Amendment.sequelize.col('id')), 'total'],
        [Amendment.sequelize.fn('COUNT', Amendment.sequelize.literal(`CASE WHEN f12_status = 'pending' THEN 1 END`)), 'pending'],
        [Amendment.sequelize.fn('COUNT', Amendment.sequelize.literal(`CASE WHEN f12_status = 'examiner_approved' THEN 1 END`)), 'examiner_approved'],
        [Amendment.sequelize.fn('COUNT', Amendment.sequelize.literal(`CASE WHEN f12_status = 'supervisor_approved' THEN 1 END`)), 'supervisor_approved'],
        [Amendment.sequelize.fn('COUNT', Amendment.sequelize.literal(`CASE WHEN f12_status = 'completed' THEN 1 END`)), 'completed'],
      ]
    });

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching amendment stats', error: error.message });
  }
};
