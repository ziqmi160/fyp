import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, register, getMe } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many attempts. Try again later.' }
});

router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);
router.get('/me', verifyToken, getMe);

export default router;
