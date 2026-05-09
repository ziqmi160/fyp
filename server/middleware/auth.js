import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found.' });
    }

    if (!user.is_active) {
      return res.status(401).json({ success: false, error: 'Account is deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired.' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token.' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!Array.isArray(roles)) roles = [roles];
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};
