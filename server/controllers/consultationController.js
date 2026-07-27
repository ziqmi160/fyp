import { ConsultationMeeting, User, StudentProfile } from '../models/index.js';
import { Op } from 'sequelize';
import { isPastDateTime } from '../utils/dateValidation.js';

export const getConsultationMeetings = async (req, res) => {
  try {
    const { status, phase, meeting_type } = req.query;
    const whereClause = {};
    
    if (status) whereClause.status = status;
    if (phase) whereClause.phase = phase;
    if (meeting_type) whereClause.meeting_type = meeting_type;

    // Filter by user role
    if (req.user.role === 'student') {
      whereClause.student_id = req.user.id;
    } else if (req.user.role === 'supervisor') {
      const supervisedStudents = await StudentProfile.findAll({
        where: { current_supervisor_id: req.user.id },
        attributes: ['user_id']
      });
      whereClause.supervisor_id = req.user.id;
    }

    const meetings = await ConsultationMeeting.findAll({
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
        }
      ],
      order: [['meeting_date', 'ASC'], ['start_time', 'ASC']]
    });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching consultation meetings', error: error.message });
  }
};

export const createConsultationMeeting = async (req, res) => {
  try {
    const { 
      student_id, 
      meeting_date, 
      start_time, 
      end_time, 
      venue, 
      meeting_type, 
      agenda, 
      phase
    } = req.body;

    if (isPastDateTime(meeting_date, start_time)) {
      return res.status(400).json({ message: 'Meetings cannot be scheduled in the past' });
    }

    // Verify supervisor-student relationship
    const studentProfile = await StudentProfile.findOne({
      where: { 
        user_id: student_id,
        current_supervisor_id: req.user.id 
      }
    });

    if (!studentProfile && req.user.role === 'supervisor') {
      return res.status(403).json({ message: 'You can only create meetings for your supervisees' });
    }

    const meeting = await ConsultationMeeting.create({
      student_id,
      supervisor_id: req.user.role === 'supervisor' ? req.user.id : studentProfile.current_supervisor_id,
      meeting_date,
      start_time,
      end_time,
      venue,
      meeting_type: meeting_type || 'consultation',
      agenda,
      phase: phase || 'CSP600',
      created_by: req.user.id
    });

    const createdMeeting = await ConsultationMeeting.findByPk(meeting.id, {
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
        }
      ]
    });

    res.status(201).json(createdMeeting);
  } catch (error) {
    res.status(500).json({ message: 'Error creating consultation meeting', error: error.message });
  }
};

export const updateConsultationMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      meeting_date, 
      start_time, 
      end_time, 
      venue, 
      agenda, 
      status, 
      student_notes, 
      supervisor_notes 
    } = req.body;

    const meeting = await ConsultationMeeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({ message: 'Consultation meeting not found' });
    }

    // Check permissions
    if (req.user.role === 'student' && meeting.student_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own meetings' });
    }
    if (req.user.role === 'supervisor' && meeting.supervisor_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only update meetings you supervise' });
    }

    // Only block past dates when the meeting is actually being (re)scheduled,
    // not when it's being marked completed/cancelled or only notes change.
    const isReschedule =
      status !== 'completed' && status !== 'cancelled' &&
      (meeting_date !== meeting.meeting_date || start_time !== meeting.start_time);
    if (isReschedule && isPastDateTime(meeting_date, start_time)) {
      return res.status(400).json({ message: 'Meetings cannot be rescheduled to a past date' });
    }

    await meeting.update({
      meeting_date,
      start_time,
      end_time,
      venue,
      agenda,
      status,
      student_notes: req.user.role === 'student' ? student_notes : meeting.student_notes,
      supervisor_notes: req.user.role === 'supervisor' ? supervisor_notes : meeting.supervisor_notes,
      updated_by: req.user.id
    });

    const updatedMeeting = await ConsultationMeeting.findByPk(id, {
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
        }
      ]
    });

    res.json(updatedMeeting);
  } catch (error) {
    res.status(500).json({ message: 'Error updating consultation meeting', error: error.message });
  }
};

export const signF5Form = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      consultation_summary,
      action_items,
      next_steps,
      student_declaration,
      supervisor_declaration
    } = req.body;

    const meeting = await ConsultationMeeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({ message: 'Consultation meeting not found' });
    }

    if (meeting.status !== 'completed') {
      return res.status(400).json({ message: 'Meeting must be completed before signing F5 form' });
    }

    // Check permissions
    if (req.user.role === 'student' && meeting.student_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only sign your own F5 form' });
    }
    if (req.user.role === 'supervisor' && meeting.supervisor_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only sign F5 forms for your supervisees' });
    }

    const f5Data = meeting.f5_form_data || {};
    
    if (req.user.role === 'student') {
      f5Data.student_declaration = student_declaration;
      f5Data.student_signature_date = new Date();
      await meeting.update({
        f5_form_data: f5Data,
        student_signed: true,
        student_signature_date: new Date()
      });
    } else if (req.user.role === 'supervisor') {
      f5Data.supervisor_declaration = supervisor_declaration;
      f5Data.consultation_summary = consultation_summary;
      f5Data.action_items = action_items;
      f5Data.next_steps = next_steps;
      f5Data.supervisor_signature_date = new Date();
      await meeting.update({
        f5_form_data: f5Data,
        supervisor_signed: true,
        supervisor_signature_date: new Date()
      });
    }

    const updatedMeeting = await ConsultationMeeting.findByPk(id, {
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
        }
      ]
    });

    res.json(updatedMeeting);
  } catch (error) {
    res.status(500).json({ message: 'Error signing F5 form', error: error.message });
  }
};

export const getConsultationStats = async (req, res) => {
  try {
    const whereClause = {};
    
    // Filter by user role
    if (req.user.role === 'student') {
      whereClause.student_id = req.user.id;
    } else if (req.user.role === 'supervisor') {
      whereClause.supervisor_id = req.user.id;
    }

    const stats = await ConsultationMeeting.findAll({
      where: whereClause,
      attributes: [
        [ConsultationMeeting.sequelize.fn('COUNT', ConsultationMeeting.sequelize.col('id')), 'total'],
        [ConsultationMeeting.sequelize.fn('COUNT', ConsultationMeeting.sequelize.literal(`CASE WHEN status = 'scheduled' THEN 1 END`)), 'scheduled'],
        [ConsultationMeeting.sequelize.fn('COUNT', ConsultationMeeting.sequelize.literal(`CASE WHEN status = 'completed' THEN 1 END`)), 'completed'],
        [ConsultationMeeting.sequelize.fn('COUNT', ConsultationMeeting.sequelize.literal(`CASE WHEN student_signed = true AND supervisor_signed = true THEN 1 END`)), 'f5_signed'],
      ]
    });

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching consultation stats', error: error.message });
  }
};
