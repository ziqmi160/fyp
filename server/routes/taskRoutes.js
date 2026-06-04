import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { coordinatorOnly, studentOnly } from '../middleware/rbac.js';
import {
  getCoordinatorTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskSubmissions,
  getMyClassTasks
} from '../controllers/taskController.js';

const router = express.Router();

router.use(verifyToken);

// Coordinator routes
router.get('/coordinator', coordinatorOnly, getCoordinatorTasks);
router.post('/coordinator', coordinatorOnly, createTask);
router.put('/coordinator/:id', coordinatorOnly, updateTask);
router.delete('/coordinator/:id', coordinatorOnly, deleteTask);
router.get('/coordinator/:id/submissions', coordinatorOnly, getTaskSubmissions);

// Student routes
router.get('/my-class', studentOnly, getMyClassTasks);

export default router;
