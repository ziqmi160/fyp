import express from 'express';
import { submitEvaluation, getStudentEvaluations } from '../controllers/evaluationController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', submitEvaluation);
router.get('/student/:student_id', getStudentEvaluations);

export default router;
