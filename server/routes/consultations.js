import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  getConsultationMeetings,
  createConsultationMeeting,
  updateConsultationMeeting,
  signF5Form,
  getConsultationStats
} from '../controllers/consultationController.js';

const router = express.Router();

router.use(verifyToken);

// Get consultation meetings (filtered by user role)
router.get('/', getConsultationMeetings);

// Get consultation statistics
router.get('/stats', getConsultationStats);

// Create consultation meeting (supervisor only)
router.post('/', requireRole('supervisor'), createConsultationMeeting);

// Update consultation meeting
router.put('/:id', updateConsultationMeeting);

// Sign F5 form (student or supervisor)
router.post('/:id/f5-sign', signF5Form);

export default router;
