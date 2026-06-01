import bcrypt from 'bcryptjs';
import { User, SupervisorProfile } from '../models/index.js';

export const createCoordinator = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
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
      approval_status: null
    });

    res.status(201).json({
      success: true,
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
      message: 'Coordinator account created.'
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
    res.json({ success: true, data: { coordinators } });
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
