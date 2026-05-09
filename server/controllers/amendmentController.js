import { Amendment, User, StudentProfile, PresentationSlot, EvaluationForm } from '../models/index.js';
import { Op } from 'sequelize';

export const getAmendments = async (req, res) => {
  try {
    const { status, student_id, phase } = req.query;
    const whereClause = {};
    
    if (status) whereClause.status = status;
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
          as: 'supervisor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'examiner',
          attributes: ['id', 'name', 'email']
        },
        {
          model: PresentationSlot,
          as: 'PresentationSlot',
          include: [
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

    // Check if amendment already exists for this presentation
    const existingAmendment = await Amendment.findOne({
      where: { presentation_slot_id }
    });

    if (existingAmendment) {
      return res.status(400).json({ message: 'Amendment already exists for this presentation' });
    }

    const amendment = await Amendment.create({
      student_id: presentationSlot.student_id,
      presentation_slot_id,
      supervisor_id: presentationSlot.supervisor_id,
      examiner_id: presentationSlot.examiner_id,
      amendment_type,
      description,
      deadline_date,
      phase: phase || 'CSP650',
      status: 'pending',
      created_by: req.user.id
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
          as: 'supervisor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'examiner',
          attributes: ['id', 'name', 'email']
        },
        {
          model: PresentationSlot,
          as: 'PresentationSlot',
          include: [
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
    const { description, deadline_date, status, f12_form_data } = req.body;

    const amendment = await Amendment.findByPk(id);
    if (!amendment) {
      return res.status(404).json({ message: 'Amendment not found' });
    }

    // Validate status transitions
    if (amendment.status === 'completed' && status !== 'completed') {
      return res.status(400).json({ message: 'Cannot change status of completed amendment' });
    }

    await amendment.update({
      description,
      deadline_date,
      status,
      f12_form_data,
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
          as: 'supervisor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'examiner',
          attributes: ['id', 'name', 'email']
        },
        {
          model: PresentationSlot,
          as: 'PresentationSlot',
          include: [
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

    if (amendment.status !== 'pending') {
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

    if (amendment.status !== 'in_progress') {
      return res.status(400).json({ message: 'F12 form can only be submitted for amendments in progress' });
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
      status: 'f12_submitted',
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
          as: 'supervisor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'examiner',
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

    if (amendment.status !== 'f12_submitted') {
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
    } else if (role === 'examiner') {
      f12Data.examiner_approval = {
        approved: true,
        approved_at: new Date(),
        approved_by: req.user.id,
        comments
      };
    }

    // Check if both have approved
    if (f12Data.supervisor_approval?.approved && f12Data.examiner_approval?.approved) {
      await amendment.update({
        f12_form_data: f12Data,
        status: 'completed',
        completed_at: new Date(),
        updated_by: req.user.id
      });
    } else {
      await amendment.update({
        f12_form_data: f12Data,
        updated_by: req.user.id
      });
    }

    const updatedAmendment = await Amendment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'supervisor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'examiner',
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
        [Amendment.sequelize.fn('COUNT', Amendment.sequelize.literal(`CASE WHEN status = 'pending' THEN 1 END`)), 'pending'],
        [Amendment.sequelize.fn('COUNT', Amendment.sequelize.literal(`CASE WHEN status = 'in_progress' THEN 1 END`)), 'in_progress'],
        [Amendment.sequelize.fn('COUNT', Amendment.sequelize.literal(`CASE WHEN status = 'f12_submitted' THEN 1 END`)), 'f12_submitted'],
        [Amendment.sequelize.fn('COUNT', Amendment.sequelize.literal(`CASE WHEN status = 'completed' THEN 1 END`)), 'completed'],
      ]
    });

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching amendment stats', error: error.message });
  }
};
