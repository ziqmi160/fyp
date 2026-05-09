import express from 'express';
import { getProfile, updateProfile, getMySchedules } from '../controllers/userController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/schedules', getMySchedules);

export default router;
