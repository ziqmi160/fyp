import express from 'express';
import { listSupervisors, getSupervisor, getMyStudents, getStudentsExamining, getExaminingSubmissions, updateAvailability, updateQuota, updateExpertise, getRecommendations } from '../controllers/supervisorController.js';
import { verifyToken } from '../middleware/auth.js';
import { studentOnly, supervisorOnly } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', verifyToken, listSupervisors);
router.get('/my/students', verifyToken, supervisorOnly, getMyStudents);
router.get('/my/examining', verifyToken, supervisorOnly, getStudentsExamining);
router.get('/my/examining/submissions', verifyToken, supervisorOnly, getExaminingSubmissions);
// /recommendations must come before /:id to avoid Express matching it as an id param
router.get('/recommendations', verifyToken, studentOnly, getRecommendations);
router.get('/:id', verifyToken, getSupervisor);
router.put('/availability', verifyToken, supervisorOnly, updateAvailability);
router.put('/quota', verifyToken, supervisorOnly, updateQuota);
router.put('/expertise', verifyToken, supervisorOnly, updateExpertise);

export default router;
