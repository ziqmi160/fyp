import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import {
  createExhibition,
  getExhibitions,
  getExhibitionDetail,
  updateExhibition,
  announceExhibitionBriefing,
  registerExhibitionAttendance,
  checkInExhibition,
  getExhibitionAttendanceReport,
  deleteExhibition
} from '../controllers/exhibitionController.js';

const router = express.Router();

router.get('/', getExhibitions);
router.get('/:id', getExhibitionDetail);

router.use(verifyToken);

// Student routes
router.post('/:exhibition_id/register', registerExhibitionAttendance);
router.post('/:exhibition_id/check-in', checkInExhibition);

// Coordinator routes
router.post('/', requireRole('coordinator'), createExhibition);
router.put('/:id', requireRole('coordinator'), updateExhibition);
router.post('/:id/announce-briefing', requireRole('coordinator'), announceExhibitionBriefing);
router.get('/:id/attendance-report', requireRole('coordinator'), getExhibitionAttendanceReport);
router.delete('/:id', requireRole('coordinator'), deleteExhibition);

export default router;
