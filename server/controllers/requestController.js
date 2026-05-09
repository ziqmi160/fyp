import { SupervisionRequest, StudentProfile, SupervisorProfile, User, OfficialDocument } from '../models/index.js';
import { createNotification } from './notificationController.js';
import { generateMutualAcceptance } from '../services/pdfService.js';

export const createRequest = async (req, res) => {
  try {
    const { supervisor_id, title_proposed, message } = req.body;
    const studentId = req.user.id;

    const studentProfile = await StudentProfile.findOne({ where: { user_id: studentId } });
    if (!studentProfile) {
      return res.status(400).json({ success: false, error: 'Student profile not found.' });
    }

    if (studentProfile.current_supervisor_id) {
      return res.status(400).json({ success: false, error: 'You already have an active supervisor.' });
    }

    const pendingRequest = await SupervisionRequest.findOne({
      where: { student_id: studentId, status: 'pending' }
    });
    if (pendingRequest) {
      return res.status(400).json({ success: false, error: 'You already have a pending supervision request.' });
    }

    const supervisorProfile = await SupervisorProfile.findOne({ where: { user_id: supervisor_id } });
    if (!supervisorProfile) {
      return res.status(404).json({ success: false, error: 'Supervisor not found.' });
    }

    if (!supervisorProfile.is_accepting || supervisorProfile.current_student_count >= supervisorProfile.max_students) {
      return res.status(400).json({ success: false, error: 'Supervisor is not accepting students or quota is full.' });
    }

    const request = await SupervisionRequest.create({
      student_id: studentId,
      supervisor_id,
      title_proposed,
      message
    });

    await studentProfile.update({ fyp_status: 'pending_approval' });

    await createNotification(supervisor_id, 'New Supervision Request', `You have a new supervision request from ${req.user.name} for: ${title_proposed}`, 'info', request.id, 'supervision_request');

    res.status(201).json({
      success: true,
      data: request,
      message: 'Supervision request sent.'
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getIncomingRequests = async (req, res) => {
  try {
    const requests = await SupervisionRequest.findAll({
      where: { supervisor_id: req.user.id },
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });

    const withStudentProfile = await Promise.all(requests.map(async (r) => {
      const profile = await StudentProfile.findOne({ where: { user_id: r.student_id } });
      const data = r.toJSON();
      data.student_profile = profile;
      return data;
    }));

    res.json({ success: true, data: withStudentProfile });
  } catch (error) {
    console.error('Get incoming requests error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getMyRequests = async (req, res) => {
  try {
    const requests = await SupervisionRequest.findAll({
      where: { student_id: req.user.id },
      include: [
        { model: User, as: 'supervisor', attributes: ['id', 'name', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });

    const withSupervisorProfile = await Promise.all(requests.map(async (r) => {
      const profile = await SupervisorProfile.findOne({ where: { user_id: r.supervisor_id } });
      const data = r.toJSON();
      data.supervisor_profile = profile;
      return data;
    }));

    res.json({ success: true, data: withSupervisorProfile });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    const request = await SupervisionRequest.findByPk(req.params.id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'supervisor', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!request || request.supervisor_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Request is no longer pending.' });
    }

    const supervisorProfile = await SupervisorProfile.findOne({ where: { user_id: req.user.id } });
    if (supervisorProfile.current_student_count >= supervisorProfile.max_students) {
      return res.status(400).json({ success: false, error: 'Your quota is full. Cannot accept more students.' });
    }

    await request.update({ status: 'accepted' });

    const studentProfile = await StudentProfile.findOne({ where: { user_id: request.student_id } });
    if (studentProfile) {
      await studentProfile.update({
        current_supervisor_id: req.user.id,
        fyp_title: request.title_proposed,
        fyp_status: 'active'
      });
    }

    await supervisorProfile.increment('current_student_count');

    const pdfPath = await generateMutualAcceptance({
      student: request.student,
      supervisor: request.supervisor,
      title: request.title_proposed,
      date: new Date()
    });

    await OfficialDocument.create({
      student_id: request.student_id,
      supervisor_id: req.user.id,
      document_type: 'mutual_acceptance',
      file_path: pdfPath
    });

    await createNotification(request.student_id, 'Supervision Accepted', `${request.supervisor.name} has accepted your supervision request for: ${request.title_proposed}`, 'success', request.id, 'supervision_request');

    res.json({
      success: true,
      data: request,
      message: 'Request accepted. Mutual Acceptance document generated.'
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const { rejected_reason } = req.body;
    const request = await SupervisionRequest.findByPk(req.params.id, {
      include: [{ model: User, as: 'supervisor', attributes: ['id', 'name'] }]
    });

    if (!request || request.supervisor_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Request is no longer pending.' });
    }

    await request.update({ status: 'rejected', rejected_reason: rejected_reason || '' });

    const studentProfile = await StudentProfile.findOne({ where: { user_id: request.student_id } });
    if (studentProfile?.fyp_status === 'pending_approval') {
      await studentProfile.update({ fyp_status: 'no_supervisor' });
    }

    await createNotification(request.student_id, 'Supervision Request Rejected', `${request.supervisor.name} has declined your supervision request.${rejected_reason ? ` Reason: ${rejected_reason}` : ''}`, 'warning', request.id, 'supervision_request');

    res.json({
      success: true,
      data: request,
      message: 'Request rejected.'
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
