import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { getStudentProgress } from '../controllers/progressTrackerController.js';

const router = express.Router();

router.use(verifyToken);

// Student routes
router.get('/my-progress', requireRole('student'), getStudentProgress);

export default router;
