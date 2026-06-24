import { User, SupervisorProfile, StudentProfile, Submission, SubmissionAttachment } from '../models/index.js';
import { Op } from 'sequelize';
import { recommendSupervisors, recomputeSupervisorEmbedding, clearSupervisorEmbeddingCache } from '../services/embeddingService.js';

export const listSupervisors = async (req, res) => {
  try {
    const { search, expertise, available_only } = req.query;

    const where = {};
    if (available_only === 'true') {
      where.is_accepting = true;
    }
    if (expertise) {
      where.expertise = { [Op.like]: `%${expertise}%` };
    }

    const profiles = await SupervisorProfile.findAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }]
    });

    let result = profiles.map(p => ({
      ...p.toJSON(),
      name: p.User?.name,
      email: p.User?.email
    }));

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(r => {
        const expertiseText = Array.isArray(r.expertise) ? r.expertise.join(' ') : '';
        return (r.name || '').toLowerCase().includes(s) || expertiseText.toLowerCase().includes(s);
      });
    }

    if (available_only === 'true') {
      result = result.filter(r => r.current_student_count < r.max_students);
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('List supervisors error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getSupervisor = async (req, res) => {
  try {
    const profile = await SupervisorProfile.findOne({
      where: { id: req.params.id },
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Supervisor not found.' });
    }

    const data = profile.toJSON();
    data.name = profile.User?.name;
    data.email = profile.User?.email;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get supervisor error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const profile = await SupervisorProfile.findOne({
      where: { user_id: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Supervisor profile not found.' });
    }

    const { is_accepting } = req.body;
    await profile.update({ is_accepting: is_accepting ?? profile.is_accepting });

    res.json({ success: true, data: profile, message: 'Availability updated.' });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getMyStudents = async (req, res) => {
  try {
    const profiles = await StudentProfile.findAll({
      where: { current_supervisor_id: req.user.id }
    });

    const userIds = profiles.map(p => p.user_id);
    const users = await User.findAll({ where: { id: userIds }, attributes: ['id', 'name', 'email'] });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const result = profiles.map(p => ({
      ...p.toJSON(),
      name: userMap[p.user_id]?.name,
      email: userMap[p.user_id]?.email
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get my students error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const updateQuota = async (req, res) => {
  try {
    const profile = await SupervisorProfile.findOne({
      where: { user_id: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Supervisor profile not found.' });
    }

    const { max_students } = req.body;
    if (typeof max_students !== 'number' || max_students < 0) {
      return res.status(400).json({ success: false, error: 'Invalid max_students value.' });
    }

    await profile.update({ max_students });

    res.json({ success: true, data: profile, message: 'Quota updated.' });
  } catch (error) {
    console.error('Update quota error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getStudentsExamining = async (req, res) => {
  try {
    const profiles = await StudentProfile.findAll({
      where: { examiner_id: req.user.id }
    });

    const userIds = profiles.map(p => p.user_id);
    const users = await User.findAll({ where: { id: userIds }, attributes: ['id', 'name', 'email'] });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const result = profiles.map(p => ({
      ...p.toJSON(),
      name: userMap[p.user_id]?.name,
      email: userMap[p.user_id]?.email
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get examining students error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getExaminingSubmissions = async (req, res) => {
  try {
    const examiningProfiles = await StudentProfile.findAll({
      where: { examiner_id: req.user.id }
    });
    const examiningStudentIds = examiningProfiles.map(p => p.user_id);

    const submissions = await Submission.findAll({
      where: {
        student_id: { [Op.in]: examiningStudentIds },
        submission_type: { [Op.in]: ['F6a', 'F6b'] }
      },
      include: [
        SubmissionAttachment,
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] }
      ],
      order: [['submitted_at', 'DESC']]
    });

    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Get examining submissions error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const updateExpertise = async (req, res) => {
  try {
    const profile = await SupervisorProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Supervisor profile not found.' });
    }

    const { expertise } = req.body;
    if (!Array.isArray(expertise)) {
      return res.status(400).json({ success: false, error: 'Expertise must be an array.' });
    }

    await profile.update({ expertise });
    await recomputeSupervisorEmbedding(profile);
    clearSupervisorEmbeddingCache(profile.id);

    res.json({ success: true, data: { expertise: profile.expertise }, message: 'Expertise updated.' });
  } catch (error) {
    console.error('Update expertise error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const studentProfile = await StudentProfile.findOne({ where: { user_id: req.user.id } });
    if (!studentProfile) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    // Combine title + description so strong title keywords also drive the match.
    const description =
      req.query.description ||
      [studentProfile.fyp_title, studentProfile.project_description]
        .filter(Boolean)
        .join('. ');
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, error: 'No project description provided.' });
    }

    const profiles = await SupervisorProfile.findAll({
      where: { is_accepting: true },
      include: [{ model: User, attributes: ['id', 'name', 'email'], where: { is_active: true } }]
    });

    const candidates = profiles
      .filter(p => p.current_student_count < p.max_students)
      .map(p => ({
        id: p.id,
        user_id: p.User.id,
        name: p.User.name,
        email: p.User.email,
        staff_id: p.staff_id,
        expertise: p.expertise,
        max_students: p.max_students,
        current_student_count: p.current_student_count,
        is_accepting: p.is_accepting,
      }));

    const scored = await recommendSupervisors(description, candidates, 3);

    res.json({ success: true, data: scored });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
