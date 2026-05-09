import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  getPresentationSessions,
  createPresentationSession,
  updatePresentationSession,
  deletePresentationSession,
  createPresentationSlot,
  updatePresentationSlot,
  deletePresentationSlot,
  getMyPresentationSlots,
  confirmPresentationSlot
} from '../controllers/presentationSessionController.js';

const router = express.Router();

router.use(verifyToken);

// Coordinator routes
router.get('/', requireRole('coordinator'), getPresentationSessions);
router.post('/', requireRole('coordinator'), createPresentationSession);
router.put('/:id', requireRole('coordinator'), updatePresentationSession);
router.delete('/:id', requireRole('coordinator'), deletePresentationSession);

// Slot management (coordinator only)
router.post('/slots', requireRole('coordinator'), createPresentationSlot);
router.put('/slots/:id', requireRole('coordinator'), updatePresentationSlot);
router.delete('/slots/:id', requireRole('coordinator'), deletePresentationSlot);

// User routes for viewing their own slots
router.get('/my-slots', getMyPresentationSlots);
router.put('/slots/:id/confirm', confirmPresentationSlot);

export default router;
