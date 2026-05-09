import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  getDistributedReports,
  distributeReport,
  getAvailableReports,
  getDistributionStats
} from '../controllers/reportDistributionController.js';

const router = express.Router();

router.use(verifyToken);

// Get distributed reports (filtered by user role)
router.get('/', getDistributedReports);

// Get available reports for distribution (coordinator only)
router.get('/available', requireRole('coordinator'), getAvailableReports);

// Distribute report to examiner (coordinator only)
router.post('/distribute', requireRole('coordinator'), distributeReport);

// Get distribution statistics
router.get('/stats', getDistributionStats);

export default router;
