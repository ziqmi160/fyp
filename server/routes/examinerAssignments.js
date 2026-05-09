import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  getExaminerAssignments,
  createExaminerAssignment,
  updateExaminerAssignment,
  deleteExaminerAssignment,
  getMyExaminerAssignments,
  getAvailableExaminers
} from '../controllers/examinerAssignmentController.js';

const router = express.Router();

router.use(verifyToken);

// Coordinator routes
router.get('/', requireRole('coordinator'), getExaminerAssignments);
router.post('/', requireRole('coordinator'), createExaminerAssignment);
router.put('/:id', requireRole('coordinator'), updateExaminerAssignment);
router.delete('/:id', requireRole('coordinator'), deleteExaminerAssignment);
router.get('/available', requireRole('coordinator'), getAvailableExaminers);

// Supervisor routes
router.get('/my-assignments', requireRole('supervisor'), getMyExaminerAssignments);

export default router;
