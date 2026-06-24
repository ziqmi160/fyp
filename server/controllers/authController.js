import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, StudentProfile, SupervisorProfile, Class } from '../models/index.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await User.scope('withPassword').findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      if (user.approval_status === 'pending') {
        return res.status(403).json({ success: false, error: 'Your account is pending coordinator approval.' });
      }
      if (user.approval_status === 'rejected') {
        return res.status(403).json({ success: false, error: 'Your registration was rejected. Please contact the coordinator.' });
      }
      return res.status(401).json({ success: false, error: 'Account is deactivated.' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const userData = user.toJSON();
    delete userData.password;

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      },
      message: 'Login successful.'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, student_id, staff_id, programme, expertise } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Name, email, password and role are required.' });
    }

    if (role === 'coordinator' || role === 'super_admin') {
      return res.status(403).json({ success: false, error: 'This role cannot self-register.' });
    }

    // Students are registered by the coordinator via CSV import — self-registration is disabled.
    if (role === 'student') {
      return res.status(403).json({ success: false, error: 'Student accounts are created by the coordinator. Please contact your coordinator.' });
    }

    if (role !== 'supervisor') {
      return res.status(400).json({ success: false, error: 'Invalid role.' });
    }

    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const isSupervisor = role === 'supervisor';
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      is_active: !isSupervisor,
      approval_status: isSupervisor ? 'pending' : null
    });

    if (role === 'student') {
      if (!student_id) {
        return res.status(400).json({ success: false, error: 'Student ID is required.' });
      }
      await StudentProfile.create({ user_id: user.id, student_id, programme: programme || null });
    }

    if (role === 'supervisor') {
      if (!staff_id) {
        return res.status(400).json({ success: false, error: 'Staff ID is required.' });
      }
      await SupervisorProfile.create({ user_id: user.id, staff_id, expertise: Array.isArray(expertise) ? expertise : [] });
      return res.status(201).json({
        success: true,
        data: null,
        message: 'Registration submitted. Awaiting coordinator approval.'
      });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      },
      message: 'Registration successful.'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// Self-registration for usability testing: creates a single account that can
// switch between student, supervisor and coordinator views via switchRole().
// Starts as a student; the supervisor/coordinator profiles are provisioned
// lazily the first time the account switches into those roles.
export const registerMultiRole = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required.' });
    }

    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'student',
      is_active: true,
      is_multi_role: true,
    });

    await StudentProfile.create({
      user_id: user.id,
      student_id: `TESTER-${user.id}`,
      programme: 'CS',
      fyp_status: 'no_supervisor',
    });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, is_multi_role: true }
      },
      message: 'Testing account created.'
    });
  } catch (error) {
    console.error('Multi-role register error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

const MULTI_ROLES = ['student', 'supervisor', 'coordinator'];

export const switchRole = async (req, res) => {
  try {
    if (!req.user.is_multi_role) {
      return res.status(403).json({ success: false, error: 'This account cannot switch roles.' });
    }

    const { role } = req.body;
    if (!MULTI_ROLES.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role.' });
    }

    const user = req.user;

    if (role === 'student') {
      await StudentProfile.findOrCreate({
        where: { user_id: user.id },
        defaults: {
          student_id: `TESTER-${user.id}`,
          programme: 'CS',
          fyp_status: 'no_supervisor',
        },
      });
    }

    if (role === 'supervisor') {
      await SupervisorProfile.findOrCreate({
        where: { user_id: user.id },
        defaults: {
          staff_id: `TESTER-${user.id}`,
          expertise: ['Software Engineering'],
          max_students: 5,
          is_accepting: true,
        },
      });
    }

    if (role === 'coordinator') {
      const [testClass] = await Class.findOrCreate({
        where: { coordinator_id: user.id },
        defaults: {
          name: `TESTER-${user.id}`,
          phase: 'CSP600',
          coordinator_id: user.id,
          academic_year: 'Usability Testing',
          is_active: true,
        },
      });
      if (!user.coordinator_phase) {
        await user.update({ coordinator_phase: testClass.phase });
      }
      // Link the account's own student identity into its own test class.
      await StudentProfile.update(
        { class_id: testClass.id, current_phase: testClass.phase },
        { where: { user_id: user.id } }
      );
    }

    await user.update({ role, approval_status: role === 'supervisor' ? 'approved' : user.approval_status });

    res.json({
      success: true,
      data: { user: { id: user.id, name: user.name, email: user.email, role, is_multi_role: true } },
      message: `Switched to ${role} view.`
    });
  } catch (error) {
    console.error('Switch role error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      data: { user: req.user }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
