import { User, StudentProfile, SupervisorProfile, PresentationSchedule } from '../models/index.js';

export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    let profile = null;

    if (user.role === 'student') {
      profile = await StudentProfile.findOne({
        where: { user_id: user.id },
        include: ['supervisor', 'examiner']
      });
    } else if (user.role === 'supervisor') {
      profile = await SupervisorProfile.findOne({
        where: { user_id: user.id }
      });
    }

    res.json({
      success: true,
      data: { user, profile }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    await req.user.update({ name: name || req.user.name });

    res.json({
      success: true,
      data: { user: req.user },
      message: 'Profile updated.'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getMySchedules = async (req, res) => {
  try {
    const schedules = await PresentationSchedule.findAll({
      where: { student_id: req.user.id }
    });
    res.json({ success: true, data: schedules });
  } catch (error) {
    console.error('Get my schedules error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const updateProjectDescription = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, error: 'Only students can set a project description.' });
    }

    const { project_description } = req.body;
    const profile = await StudentProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    await profile.update({ project_description: project_description || null });

    res.json({ success: true, data: { project_description: profile.project_description }, message: 'Project description saved.' });
  } catch (error) {
    console.error('Update project description error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const submitFypProposal = async (req, res) => {
  try {
    const { fyp_title, project_description } = req.body;

    if (!fyp_title?.trim()) {
      return res.status(400).json({ success: false, error: 'FYP title is required.' });
    }
    if (!project_description?.trim()) {
      return res.status(400).json({ success: false, error: 'Project description is required.' });
    }

    const profile = await StudentProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    if (profile.title_status === 'approved') {
      return res.status(400).json({ success: false, error: 'Your title has already been approved and cannot be changed.' });
    }

    await profile.update({
      fyp_title: fyp_title.trim(),
      project_description: project_description.trim(),
      title_status: 'pending',
      title_feedback: null
    });

    res.json({ success: true, data: profile, message: 'FYP proposal submitted for review.' });
  } catch (error) {
    console.error('Submit FYP proposal error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const withdrawFypProposal = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) return res.status(404).json({ success: false, error: 'Student profile not found.' });

    if (profile.title_status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Only pending proposals can be withdrawn.' });
    }

    await profile.update({ title_status: 'not_submitted' });
    res.json({ success: true, message: 'Proposal withdrawn.' });
  } catch (error) {
    console.error('Withdraw proposal error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
