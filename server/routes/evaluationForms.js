import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  getRubricTemplate,
  getEvaluationForms,
  createEvaluationForm,
  updateEvaluationForm,
  getMyEvaluationForms,
  getStudentEvaluationForms,
  deleteEvaluationForm
} from '../controllers/evaluationFormController.js';

const router = express.Router();

router.use(verifyToken);

// Public routes for getting rubric templates
router.get('/templates/:formType', getRubricTemplate);

// Coordinator routes
router.get('/', requireRole('coordinator'), getEvaluationForms);

// Supervisor/Examiner routes
router.get('/my-forms', requireRole('supervisor'), getMyEvaluationForms);
router.post('/', requireRole('supervisor'), createEvaluationForm);
router.put('/:id', requireRole('supervisor'), updateEvaluationForm);
router.delete('/:id', requireRole('supervisor'), deleteEvaluationForm);

// Student routes
router.get('/my-evaluations', requireRole('student'), getStudentEvaluationForms);

export default router;
