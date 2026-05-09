import { MeetingLog, StudentProfile, User } from '../models/index.js';
import { createNotification } from './notificationController.js';

export const createMeeting = async (req, res) => {
  try {
    const { student_id, meeting_date, meeting_time, location, agenda } = req.body;

    let studentId, supervisorId;
    if (req.user.role === 'student') {
      const profile = await StudentProfile.findOne({ where: { user_id: req.user.id } });
      if (!profile?.current_supervisor_id) {
        return res.status(400).json({ success: false, error: 'You need an active supervisor to book meetings.' });
      }
      studentId = req.user.id;
      supervisorId = profile.current_supervisor_id;
    } else {
      studentId = student_id;
      supervisorId = req.user.id;
    }

    const meeting = await MeetingLog.create({
      student_id: studentId,
      supervisor_id: supervisorId,
      meeting_date,
      meeting_time,
      location: location || null,
      agenda: agenda || null,
      status: 'scheduled',
      created_by: req.user.id
    });

    await createNotification(supervisorId, 'Meeting Booked', `A meeting has been scheduled for ${meeting_date} ${meeting_time}`, 'info', meeting.id, 'meeting');
    if (studentId !== req.user.id) {
      await createNotification(studentId, 'Meeting Booked', `A meeting has been scheduled for ${meeting_date} ${meeting_time}`, 'info', meeting.id, 'meeting');
    }

    const fullMeeting = await MeetingLog.findByPk(meeting.id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'supervisor', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(201).json({
      success: true,
      data: fullMeeting,
      message: 'Meeting created.'
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getMyMeetings = async (req, res) => {
  try {
    const where = req.user.role === 'student'
      ? { student_id: req.user.id }
      : { supervisor_id: req.user.id };

    const meetings = await MeetingLog.findAll({
      where,
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'supervisor', attributes: ['id', 'name', 'email'] }
      ],
      order: [['meeting_date', 'DESC'], ['meeting_time', 'DESC']]
    });

    res.json({ success: true, data: meetings });
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getMeeting = async (req, res) => {
  try {
    const meeting = await MeetingLog.findByPk(req.params.id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'supervisor', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found.' });
    }

    const isParticipant = meeting.student_id === req.user.id || meeting.supervisor_id === req.user.id;
    if (!isParticipant) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    res.json({ success: true, data: meeting });
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const updateMeeting = async (req, res) => {
  try {
    const meeting = await MeetingLog.findByPk(req.params.id);

    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found.' });
    }

    const isParticipant = meeting.student_id === req.user.id || meeting.supervisor_id === req.user.id;
    if (!isParticipant) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const { student_notes, supervisor_notes, outcome, status } = req.body;

    const updates = {};
    if (req.user.role === 'student' && student_notes !== undefined) updates.student_notes = student_notes;
    if (req.user.role === 'supervisor') {
      if (supervisor_notes !== undefined) updates.supervisor_notes = supervisor_notes;
      if (outcome !== undefined) updates.outcome = outcome;
      if (status !== undefined) updates.status = status;
    }

    await meeting.update(updates);

    res.json({ success: true, data: meeting, message: 'Meeting updated.' });
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const cancelMeeting = async (req, res) => {
  try {
    const meeting = await MeetingLog.findByPk(req.params.id);

    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found.' });
    }

    const isParticipant = meeting.student_id === req.user.id || meeting.supervisor_id === req.user.id;
    if (!isParticipant) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    if (meeting.status === 'cancelled') {
      return res.status(400).json({ success: false, error: 'Meeting already cancelled.' });
    }

    await meeting.update({ status: 'cancelled' });

    await createNotification(meeting.student_id, 'Meeting Cancelled', `Meeting on ${meeting.meeting_date} has been cancelled.`, 'warning', meeting.id, 'meeting');
    await createNotification(meeting.supervisor_id, 'Meeting Cancelled', `Meeting on ${meeting.meeting_date} has been cancelled.`, 'warning', meeting.id, 'meeting');

    res.json({ success: true, data: meeting, message: 'Meeting cancelled.' });
  } catch (error) {
    console.error('Cancel meeting error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
