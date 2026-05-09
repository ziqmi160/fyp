import { PresentationSession, PresentationSlot, ExaminerAssignment, User, StudentProfile } from '../models/index.js';
import { Op } from 'sequelize';

export const getPresentationSessions = async (req, res) => {
  try {
    const { phase, session_type, status } = req.query;
    const whereClause = {};
    
    if (phase) whereClause.phase = phase;
    if (session_type) whereClause.session_type = session_type;
    if (status) whereClause.status = status;

    const sessions = await PresentationSession.findAll({
      where: whereClause,
      include: [
        {
          model: PresentationSlot,
          as: 'PresentationSlots',
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
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ],
      order: [['date', 'ASC'], ['start_time', 'ASC']]
    });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching presentation sessions', error: error.message });
  }
};

export const createPresentationSession = async (req, res) => {
  try {
    const { title, session_type, phase, date, start_time, end_time, venue, description } = req.body;
    const created_by = req.user.id;

    const session = await PresentationSession.create({
      title,
      session_type,
      phase,
      date,
      start_time,
      end_time,
      venue,
      description,
      created_by
    });

    const createdSession = await PresentationSession.findByPk(session.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json(createdSession);
  } catch (error) {
    res.status(500).json({ message: 'Error creating presentation session', error: error.message });
  }
};

export const updatePresentationSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, session_type, phase, date, start_time, end_time, venue, description, status } = req.body;

    const session = await PresentationSession.findByPk(id);
    if (!session) {
      return res.status(404).json({ message: 'Presentation session not found' });
    }

    await session.update({
      title,
      session_type,
      phase,
      date,
      start_time,
      end_time,
      venue,
      description,
      status
    });

    const updatedSession = await PresentationSession.findByPk(id, {
      include: [
        {
          model: PresentationSlot,
          as: 'PresentationSlots',
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
        }
      ]
    });

    res.json(updatedSession);
  } catch (error) {
    res.status(500).json({ message: 'Error updating presentation session', error: error.message });
  }
};

export const deletePresentationSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await PresentationSession.findByPk(id);
    
    if (!session) {
      return res.status(404).json({ message: 'Presentation session not found' });
    }

    // Check if session has slots
    const slotCount = await PresentationSlot.count({
      where: { session_id: id }
    });

    if (slotCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete session with scheduled presentations. Remove all slots first.' 
      });
    }

    await session.destroy();
    res.json({ message: 'Presentation session deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting presentation session', error: error.message });
  }
};

export const createPresentationSlot = async (req, res) => {
  try {
    const { session_id, student_id, supervisor_id, examiner_id, start_time, end_time, room } = req.body;

    // Verify session exists
    const session = await PresentationSession.findByPk(session_id);
    if (!session) {
      return res.status(404).json({ message: 'Presentation session not found' });
    }

    // Verify student has examiner assignment
    const assignment = await ExaminerAssignment.findOne({
      where: {
        student_id,
        examiner_id,
        phase: session.phase,
        assignment_type: session.session_type === 'final' ? 'final' : 'proposal',
        status: 'active'
      }
    });

    if (!assignment) {
      return res.status(400).json({ message: 'No valid examiner assignment found for this student' });
    }

    // Check for time conflicts
    const conflictSlot = await PresentationSlot.findOne({
      where: {
        session_id,
        [Op.or]: [
          {
            start_time: {
              [Op.lt]: end_time
            },
            end_time: {
              [Op.gt]: start_time
            }
          }
        ]
      }
    });

    if (conflictSlot) {
      return res.status(400).json({ message: 'Time slot conflicts with existing presentation' });
    }

    const slot = await PresentationSlot.create({
      session_id,
      student_id,
      supervisor_id,
      examiner_id,
      start_time,
      end_time,
      room
    });

    const createdSlot = await PresentationSlot.findByPk(slot.id, {
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

    res.status(201).json(createdSlot);
  } catch (error) {
    res.status(500).json({ message: 'Error creating presentation slot', error: error.message });
  }
};

export const updatePresentationSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, room, status, student_confirmed, notes } = req.body;

    const slot = await PresentationSlot.findByPk(id);
    if (!slot) {
      return res.status(404).json({ message: 'Presentation slot not found' });
    }

    await slot.update({
      start_time,
      end_time,
      room,
      status,
      student_confirmed,
      notes
    });

    const updatedSlot = await PresentationSlot.findByPk(id, {
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

    res.json(updatedSlot);
  } catch (error) {
    res.status(500).json({ message: 'Error updating presentation slot', error: error.message });
  }
};

export const deletePresentationSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const slot = await PresentationSlot.findByPk(id);
    
    if (!slot) {
      return res.status(404).json({ message: 'Presentation slot not found' });
    }

    await slot.destroy();
    res.json({ message: 'Presentation slot deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting presentation slot', error: error.message });
  }
};

export const getMyPresentationSlots = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    
    let whereClause = {};
    
    if (req.user.role === 'student') {
      whereClause.student_id = userId;
    } else if (req.user.role === 'supervisor') {
      whereClause[Op.or] = [
        { supervisor_id: userId },
        { examiner_id: userId }
      ];
    }

    if (status) whereClause.status = status;

    const slots = await PresentationSlot.findAll({
      where: whereClause,
      include: [
        {
          model: PresentationSession,
          as: 'PresentationSession',
          attributes: ['id', 'title', 'date', 'venue', 'session_type', 'phase']
        },
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
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching presentation slots', error: error.message });
  }
};

export const confirmPresentationSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const slot = await PresentationSlot.findByPk(id);
    if (!slot) {
      return res.status(404).json({ message: 'Presentation slot not found' });
    }

    if (slot.student_id !== userId) {
      return res.status(403).json({ message: 'You can only confirm your own presentation slot' });
    }

    await slot.update({ student_confirmed: true });

    res.json({ message: 'Presentation slot confirmed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming presentation slot', error: error.message });
  }
};
