import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  getAllTemplates,
  getRubricTemplate,
  updateRubricTemplate,
  getEvaluableStudents,
  getStudentFinalReport,
  getCoordinatorEvaluableStudents,
  getMyEvaluationForms,
  getStudentForms,
  getClassEvaluationForms,
  upsertEvaluationForm,
  coordinatorUpsertEvaluationForm,
  updateEvaluationForm,
  signEvaluationForm,
  downloadEvaluationFormPDF,
  deleteEvaluationForm
} from '../controllers/evaluationFormController.js';

const router = express.Router();

router.use(verifyToken);

// ── Rubric templates ─────────────────────────────────────────────────────────
router.get('/templates', getAllTemplates);
router.get('/templates/:formType', getRubricTemplate);
router.put('/templates/:formType', requireRole('coordinator'), updateRubricTemplate);

// ── Supervisor: evaluable students + forms ────────────────────────────────────
router.get('/students', requireRole('supervisor'), getEvaluableStudents);
router.get('/students/:studentId/final-report', requireRole('supervisor'), getStudentFinalReport);
router.get('/my', requireRole('supervisor'), getMyEvaluationForms);
router.post('/', requireRole('supervisor'), upsertEvaluationForm);

// ── Coordinator: evaluable students + forms ───────────────────────────────────
router.get('/coordinator/students', requireRole('coordinator'), getCoordinatorEvaluableStudents);
router.get('/coordinator/my', requireRole('coordinator'), getMyEvaluationForms);
router.get('/coordinator/all', requireRole('coordinator'), getClassEvaluationForms);
router.post('/coordinator', requireRole('coordinator'), coordinatorUpsertEvaluationForm);

// ── Student forms (coordinator view) ─────────────────────────────────────────
router.get('/student/:studentId', requireRole('coordinator'), getStudentForms);

// ── Update / sign / delete (supervisor or coordinator who owns the form) ──────
router.put('/:id', requireRole(['supervisor', 'coordinator']), updateEvaluationForm);
router.post('/:id/sign', requireRole(['supervisor', 'coordinator']), signEvaluationForm);
router.delete('/:id', requireRole(['supervisor', 'coordinator']), deleteEvaluationForm);

// ── PDF download (own form OR coordinator) ────────────────────────────────────
router.get('/:id/download', downloadEvaluationFormPDF);

export default router;
