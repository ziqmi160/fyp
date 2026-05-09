import express from 'express';
import { listSupervisors, getSupervisor, getMyStudents, getStudentsExamining, getExaminingSubmissions, updateAvailability, updateQuota } from '../controllers/supervisorController.js';
import { verifyToken } from '../middleware/auth.js';
import { studentOnly, supervisorOnly } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', verifyToken, listSupervisors);
router.get('/my/students', verifyToken, supervisorOnly, getMyStudents);
router.get('/my/examining', verifyToken, supervisorOnly, getStudentsExamining);
router.get('/my/examining/submissions', verifyToken, supervisorOnly, getExaminingSubmissions);
router.get('/:id', verifyToken, getSupervisor);
router.put('/availability', verifyToken, supervisorOnly, updateAvailability);
router.put('/quota', verifyToken, supervisorOnly, updateQuota);

export default router;
