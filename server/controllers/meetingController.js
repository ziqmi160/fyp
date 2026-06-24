import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { MeetingLog, StudentProfile, SupervisorProfile, User, Class } from '../models/index.js';
import { createNotification } from './notificationController.js';
import { generateF5Form } from '../services/pdfService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    const { meeting_date, meeting_time, location, agenda, student_notes, supervisor_notes, outcome, status } = req.body;

    const updates = {};

    // Both roles can reschedule while the meeting is still scheduled
    if (meeting.status === 'scheduled') {
      if (meeting_date !== undefined) updates.meeting_date = meeting_date;
      if (meeting_time !== undefined) updates.meeting_time = meeting_time;
      if (location !== undefined) updates.location = location;
      if (agenda !== undefined) updates.agenda = agenda;
    }

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

// ── F5 Form ───────────────────────────────────────────────────────────────────

// PUT /meetings/:id/f5 — supervisor or student fills completed_activity + next activity comment
export const updateF5Data = async (req, res) => {
  try {
    const meeting = await MeetingLog.findByPk(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found.' });

    const isParticipant = meeting.supervisor_id === req.user.id || meeting.student_id === req.user.id;
    if (!isParticipant) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const { completed_activity, supervisor_notes, status } = req.body;
    const updates = {};
    if (completed_activity !== undefined) updates.completed_activity = completed_activity;
    if (supervisor_notes !== undefined) updates.supervisor_notes = supervisor_notes;
    if (status !== undefined) updates.status = status;

    await meeting.update(updates);
    res.json({ success: true, data: meeting, message: 'F5 data saved.' });
  } catch (error) {
    console.error('Update F5 data error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// POST /meetings/:id/sign — supervisor signs the F5 meeting record
export const signMeeting = async (req, res) => {
  try {
    const meeting = await MeetingLog.findByPk(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found.' });
    if (meeting.supervisor_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }
    if (meeting.status !== 'completed') {
      return res.status(400).json({ success: false, error: 'Can only sign completed meetings.' });
    }

    const signer = await User.findByPk(req.user.id, { attributes: ['id', 'signature'] });
    if (!signer.signature) {
      return res.status(400).json({ success: false, error: 'No signature set. Please save your signature in Settings first.' });
    }

    await meeting.update({
      supervisor_signature_img: signer.signature,
      supervisor_signed_at: new Date(),
    });
    res.json({ success: true, data: meeting, message: 'Meeting signed.' });
  } catch (error) {
    console.error('Sign meeting error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// GET /meetings/f5/:studentId — supervisor gets all completed meetings for a student's F5 log
export const getStudentF5 = async (req, res) => {
  try {
    const meetings = await MeetingLog.findAll({
      where: {
        student_id: req.params.studentId,
        supervisor_id: req.user.id,
      },
      include: [
        { model: User, as: 'student', attributes: ['id', 'name'] },
        { model: User, as: 'supervisor', attributes: ['id', 'name'] },
      ],
      order: [['meeting_date', 'ASC'], ['meeting_time', 'ASC']],
    });
    res.json({ success: true, data: meetings });
  } catch (error) {
    console.error('Get student F5 error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// GET /meetings/my/f5 — student gets their own F5 log
export const getMyF5 = async (req, res) => {
  try {
    const meetings = await MeetingLog.findAll({
      where: { student_id: req.user.id },
      include: [
        { model: User, as: 'student', attributes: ['id', 'name'] },
        { model: User, as: 'supervisor', attributes: ['id', 'name'] },
      ],
      order: [['meeting_date', 'ASC'], ['meeting_time', 'ASC']],
    });
    res.json({ success: true, data: meetings });
  } catch (error) {
    console.error('Get my F5 error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// POST /meetings/f5/:studentId/generate — supervisor generates F5 PDF for a student
export const generateF5PDF = async (req, res) => {
  try {
    const studentProfile = await StudentProfile.findOne({
      where: { user_id: req.params.studentId },
    });
    const student = await User.findByPk(req.params.studentId, { attributes: ['id', 'name'] });
    const supervisor = await User.findByPk(req.user.id, { attributes: ['id', 'name'] });
    const supervisorProfile = await SupervisorProfile.findOne({ where: { user_id: req.user.id } });

    if (!student) return res.status(404).json({ success: false, error: 'Student not found.' });

    const meetings = await MeetingLog.findAll({
      where: { student_id: req.params.studentId, supervisor_id: req.user.id },
      order: [['meeting_date', 'ASC'], ['meeting_time', 'ASC']],
    });

    const relativePath = await generateF5Form({
      student: { id: student.id, name: student.name },
      studentProfile: {
        student_id: studentProfile?.student_id,
        programme: studentProfile?.programme,
      },
      supervisorName: supervisor.name,
      projectTitle: studentProfile?.fyp_title || '',
      meetings,
    });

    // Stream the file back
    const filePath = path.join(__dirname, '../uploads', relativePath);
    res.download(filePath, `F5_${student.name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Generate F5 PDF error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// GET /meetings/coordinator/f5/:studentId/download — coordinator downloads a
// student's F5 log for any student in a class they coordinate.
export const downloadStudentF5ForCoordinator = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ where: { user_id: req.params.studentId } });
    if (!profile) return res.status(404).json({ success: false, error: 'Student not found.' });

    const cls = profile.class_id
      ? await Class.findOne({ where: { id: profile.class_id, coordinator_id: req.user.id } })
      : null;
    if (!cls) return res.status(403).json({ success: false, error: 'This student is not in one of your classes.' });

    if (!profile.current_supervisor_id) {
      return res.status(400).json({ success: false, error: 'This student has no active supervisor yet.' });
    }

    const student = await User.findByPk(req.params.studentId, { attributes: ['id', 'name'] });
    const supervisor = await User.findByPk(profile.current_supervisor_id, { attributes: ['id', 'name'] });

    const meetings = await MeetingLog.findAll({
      where: { student_id: req.params.studentId, supervisor_id: profile.current_supervisor_id },
      order: [['meeting_date', 'ASC'], ['meeting_time', 'ASC']],
    });

    const relativePath = await generateF5Form({
      student: { id: student.id, name: student.name },
      studentProfile: { student_id: profile.student_id, programme: profile.programme },
      supervisorName: supervisor.name,
      projectTitle: profile.fyp_title || '',
      meetings,
    });

    const filePath = path.join(__dirname, '../uploads', relativePath);
    res.download(filePath, `F5_${student.name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Coordinator download F5 error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// GET /meetings/my/f5/download — student downloads their own F5 PDF
export const downloadMyF5PDF = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile?.current_supervisor_id) {
      return res.status(400).json({ success: false, error: 'No active supervisor.' });
    }

    const student = await User.findByPk(req.user.id, { attributes: ['id', 'name'] });
    const supervisor = await User.findByPk(profile.current_supervisor_id, { attributes: ['id', 'name'] });

    const meetings = await MeetingLog.findAll({
      where: { student_id: req.user.id, supervisor_id: profile.current_supervisor_id },
      order: [['meeting_date', 'ASC'], ['meeting_time', 'ASC']],
    });

    const relativePath = await generateF5Form({
      student: { id: student.id, name: student.name },
      studentProfile: {
        student_id: profile.student_id,
        programme: profile.programme,
      },
      supervisorName: supervisor.name,
      projectTitle: profile.fyp_title || '',
      meetings,
    });

    const filePath = path.join(__dirname, '../uploads', relativePath);
    res.download(filePath, `F5_${student.name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Download my F5 PDF error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
