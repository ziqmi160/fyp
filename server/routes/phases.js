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

// All routes require coordinator role
router.use(verifyToken);
router.use(requireRole('coordinator'));

router.get('/', getPhases);
router.post('/', createPhase);
router.put('/:id', updatePhase);
router.delete('/:id', deletePhase);
router.get('/active', getActivePhase);
router.put('/students/:studentId/advance-phase', advanceStudentPhase);

export default router;
