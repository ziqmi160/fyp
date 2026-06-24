import express from 'express';
import { getProfile, updateProfile, getMySchedules, updateProjectDescription, updateFypTitle, getSignature, updateSignature } from '../controllers/userController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/schedules', getMySchedules);
router.put('/profile/description', updateProjectDescription);
router.put('/profile/fyp-title', updateFypTitle);
router.get('/signature', getSignature);
router.put('/signature', updateSignature);

export default router;
