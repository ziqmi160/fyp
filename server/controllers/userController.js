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
