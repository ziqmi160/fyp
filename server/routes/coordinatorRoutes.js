import express from 'express';
import { getStats, getStudents, getSupervisors, updateSupervisorQuota, generateReport, updateStudentPhaseAndExaminer, createPresentationSchedule, getPresentationSchedules, getPendingSupervisors, updateSupervisorApproval } from '../controllers/coordinatorController.js';
import { verifyToken } from '../middleware/auth.js';
import { coordinatorOnly } from '../middleware/rbac.js';

const router = express.Router();

router.use(verifyToken, coordinatorOnly);

router.get('/stats', getStats);
router.get('/students', getStudents);
router.get('/supervisors', getSupervisors);
router.put('/supervisors/:id/quota', updateSupervisorQuota);
router.get('/reports/:type', generateReport);
router.put('/students/:id/phase-examiner', updateStudentPhaseAndExaminer);
router.post('/schedules', createPresentationSchedule);
router.get('/schedules', getPresentationSchedules);
router.get('/pending-supervisors', getPendingSupervisors);
router.put('/supervisors/:id/approval', updateSupervisorApproval);

export default router;
