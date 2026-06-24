import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { coordinatorOnly, studentOnly } from '../middleware/rbac.js';
import {
  getCoordinatorTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskSubmissions,
  downloadTaskSubmissions,
  getMyClassTasks
} from '../controllers/taskController.js';
import {
  getTaskEvaluations,
  getStudentEvaluation,
  saveEvaluation,
  generateEvaluationPDF,
  downloadEvaluationPDF,
  getDefaultRubric
} from '../controllers/taskEvaluationController.js';

const router = express.Router();

router.use(verifyToken);

// Coordinator task management
router.get('/coordinator', coordinatorOnly, getCoordinatorTasks);
router.post('/coordinator', coordinatorOnly, createTask);
router.put('/coordinator/:id', coordinatorOnly, updateTask);
router.delete('/coordinator/:id', coordinatorOnly, deleteTask);
router.get('/coordinator/:id/submissions', coordinatorOnly, getTaskSubmissions);
router.get('/coordinator/:id/submissions/download', coordinatorOnly, downloadTaskSubmissions);

// Coordinator task evaluations
router.get('/coordinator/:taskId/evaluations', coordinatorOnly, getTaskEvaluations);
router.get('/coordinator/:taskId/evaluations/:studentId', coordinatorOnly, getStudentEvaluation);
router.post('/coordinator/:taskId/evaluations/:studentId', coordinatorOnly, saveEvaluation);
router.post('/coordinator/:taskId/evaluations/:studentId/generate-pdf', coordinatorOnly, generateEvaluationPDF);
router.get('/coordinator/:taskId/evaluations/:studentId/download', coordinatorOnly, downloadEvaluationPDF);

// Default rubric helper
router.get('/default-rubric/:formType', coordinatorOnly, getDefaultRubric);

// Student routes
router.get('/my-class', studentOnly, getMyClassTasks);

export default router;
