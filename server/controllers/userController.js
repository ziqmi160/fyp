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
      if (profile) {
        const actualCount = await StudentProfile.count({ where: { current_supervisor_id: user.id } });
        profile.dataValues.current_student_count = actualCount;
      }
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

export const getSignature = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'signature']
    });
    res.json({ success: true, data: { signature: user.signature || null } });
  } catch (error) {
    console.error('Get signature error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const updateSignature = async (req, res) => {
  try {
    const { signature } = req.body;
    if (!signature) return res.status(400).json({ success: false, error: 'Signature data is required.' });

    await User.update({ signature }, { where: { id: req.user.id } });
    res.json({ success: true, message: 'Signature saved.' });
  } catch (error) {
    console.error('Update signature error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const updateFypTitle = async (req, res) => {
  try {
    const { fyp_title, project_description } = req.body;

    if (!fyp_title?.trim()) {
      return res.status(400).json({ success: false, error: 'FYP title is required.' });
    }

    const profile = await StudentProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    await profile.update({
      fyp_title: fyp_title.trim(),
      project_description: (project_description || '').trim() || null
    });

    res.json({ success: true, data: profile, message: 'FYP title saved.' });
  } catch (error) {
    console.error('Update FYP title error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
