import express from 'express';
import { createCoordinator, listCoordinators, deactivateCoordinator, reactivateCoordinator, updateCoordinatorPhase } from '../controllers/adminController.js';
import { verifyToken } from '../middleware/auth.js';
import { superAdminOnly } from '../middleware/rbac.js';

const router = express.Router();

router.use(verifyToken, superAdminOnly);

router.post('/coordinators', createCoordinator);
router.get('/coordinators', listCoordinators);
router.put('/coordinators/:id/deactivate', deactivateCoordinator);
router.put('/coordinators/:id/reactivate', reactivateCoordinator);
router.put('/coordinators/:id/phase', updateCoordinatorPhase);

export default router;
