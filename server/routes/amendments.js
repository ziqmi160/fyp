import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  getAmendments,
  createAmendment,
  updateAmendment,
  deleteAmendment,
  submitF12Form,
  approveF12Form,
  getAmendmentStats
} from '../controllers/amendmentController.js';

const router = express.Router();

router.use(verifyToken);

// Get amendments (filtered by user role)
router.get('/', getAmendments);

// Get amendment statistics
router.get('/stats', getAmendmentStats);

// Create amendment (coordinator only)
router.post('/', requireRole('coordinator'), createAmendment);

// Update amendment (supervisor, examiner, or coordinator)
router.put('/:id', updateAmendment);

// Delete amendment (coordinator only)
router.delete('/:id', requireRole('coordinator'), deleteAmendment);

// Submit F12 form (student only)
router.post('/:id/f12', requireRole('student'), submitF12Form);

// Approve F12 form (supervisor or examiner)
router.post('/:id/f12/approve', approveF12Form);

export default router;
