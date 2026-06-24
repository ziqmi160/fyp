import bcrypt from 'bcryptjs';
import { User, SupervisorProfile, Class } from '../models/index.js';
import { createDefaultTasksForClass } from './taskController.js';

export const createCoordinator = async (req, res) => {
  try {
    const { name, email, password, coordinator_phase, academic_year, classes } = req.body;

    if (!name || !email || !password || !coordinator_phase) {
      return res.status(400).json({ success: false, error: 'Name, email, password, and phase are required.' });
    }

    if (!['CSP600', 'CSP650'].includes(coordinator_phase)) {
      return res.status(400).json({ success: false, error: 'Phase must be CSP600 or CSP650.' });
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
      role: 'coordinator',
      is_active: true,
      approval_status: null,
      coordinator_phase
    });

    // Auto-create classes if provided
    const classNames = typeof classes === 'string'
      ? classes.split(',').map(s => s.trim()).filter(Boolean)
      : (Array.isArray(classes) ? classes : []);

    for (const className of classNames) {
      const cls = await Class.create({
        name: className,
        phase: coordinator_phase,
        coordinator_id: user.id,
        academic_year: academic_year || null,
        is_active: true,
      });
      await createDefaultTasksForClass(cls.id, coordinator_phase, user.id);
    }

    res.status(201).json({
      success: true,
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
      message: `Coordinator account created${classNames.length ? ` with ${classNames.length} class(es)` : ''}.`
    });
  } catch (error) {
    console.error('Create coordinator error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const listCoordinators = async (req, res) => {
  try {
    const coordinators = await User.findAll({
      where: { role: 'coordinator' },
      order: [['created_at', 'DESC']]
    });

    const withClasses = await Promise.all(coordinators.map(async (c) => {
      const classes = await Class.findAll({
        where: { coordinator_id: c.id },
        attributes: ['id', 'name', 'phase', 'academic_year'],
        order: [['name', 'ASC']]
      });
      return { ...c.toJSON(), classes };
    }));

    res.json({ success: true, data: { coordinators: withClasses } });
  } catch (error) {
    console.error('List coordinators error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const deactivateCoordinator = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ where: { id, role: 'coordinator' } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Coordinator not found.' });
    }

    await user.update({ is_active: false });
    res.json({ success: true, message: 'Coordinator deactivated.' });
  } catch (error) {
    console.error('Deactivate coordinator error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const reactivateCoordinator = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ where: { id, role: 'coordinator' } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Coordinator not found.' });
    }

    await user.update({ is_active: true });
    res.json({ success: true, message: 'Coordinator reactivated.' });
  } catch (error) {
    console.error('Reactivate coordinator error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const updateCoordinatorPhase = async (req, res) => {
  try {
    const { id } = req.params;
    const { coordinator_phase } = req.body;

    if (!['CSP600', 'CSP650'].includes(coordinator_phase)) {
      return res.status(400).json({ success: false, error: 'Phase must be CSP600 or CSP650.' });
    }

    const user = await User.findOne({ where: { id, role: 'coordinator' } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Coordinator not found.' });
    }

    await user.update({ coordinator_phase });
    res.json({ success: true, message: 'Coordinator phase updated.' });
  } catch (error) {
    console.error('Update coordinator phase error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
