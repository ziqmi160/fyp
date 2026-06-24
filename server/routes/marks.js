import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  getStudentMarks,
  getConsolidatedMarks,
  getCoordinatorMarks,
  exportMarksReport,
  getMarksStatistics
} from '../controllers/marksController.js';

const router = express.Router();

router.use(verifyToken);

// Get student marks (filtered by user role)
router.get('/', getStudentMarks);

// Coordinator consolidated marks (scoped to their own classes)
router.get('/coordinator', requireRole('coordinator'), getCoordinatorMarks);

// Get consolidated marks for reporting
router.get('/consolidated', getConsolidatedMarks);

// Export marks report (coordinator only)
router.get('/export', requireRole('coordinator'), exportMarksReport);

// Get marks statistics (coordinator only)
router.get('/statistics', requireRole('coordinator'), getMarksStatistics);

export default router;
