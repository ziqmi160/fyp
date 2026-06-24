import express from 'express';
import multer from 'multer';
import { getStats, getStudents, getSupervisors, updateSupervisorQuota, generateReport, updateStudentPhaseAndExaminer, createPresentationSchedule, getPresentationSchedules, getPendingSupervisors, updateSupervisorApproval, importStudents, getClasses, createClass, updateClass, deleteClass, assignStudentToClass, getStudentDocumentsHub, downloadStudentDocumentsBulk } from '../controllers/coordinatorController.js';
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

router.get('/classes', getClasses);
router.post('/classes', createClass);
router.put('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass);
router.post('/classes/assign-student', assignStudentToClass);
router.get('/student-documents', getStudentDocumentsHub);
router.post('/student-documents/bulk-download', downloadStudentDocumentsBulk);


export default router;
