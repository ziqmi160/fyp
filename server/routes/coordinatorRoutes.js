import express from 'express';
import multer from 'multer';
import { getStats, getStudents, getSupervisors, updateSupervisorQuota, generateReport, updateStudentPhaseAndExaminer, createPresentationSchedule, getPresentationSchedules, getPendingSupervisors, updateSupervisorApproval, importStudents } from '../controllers/coordinatorController.js';
import { verifyToken } from '../middleware/auth.js';
import { coordinatorOnly } from '../middleware/rbac.js';

const router = express.Router();
const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

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
router.post('/import-students', csvUpload.single('csv'), importStudents);

export default router;
