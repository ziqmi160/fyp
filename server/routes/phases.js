import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  getPhases,
  createPhase,
  updatePhase,
  deletePhase,
  getActivePhase,
  advanceStudentPhase
} from '../controllers/phaseController.js';

const router = express.Router();

router.use(verifyToken);

// Read-only: coordinators and super_admin can view phases
router.get('/', requireRole(['coordinator', 'super_admin']), getPhases);
router.get('/active', requireRole(['coordinator', 'super_admin']), getActivePhase);

// Write ops: super_admin only
router.post('/', requireRole('super_admin'), createPhase);
router.put('/:id', requireRole('super_admin'), updatePhase);
router.delete('/:id', requireRole('super_admin'), deletePhase);
router.put('/students/:studentId/advance-phase', requireRole('super_admin'), advanceStudentPhase);

export default router;
