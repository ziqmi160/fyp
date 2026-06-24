import express from 'express';
import { getOrCreateF6, updateF6Data, signF6, generateF6PDF, generateF6PDFByStudent } from '../controllers/f6Controller.js';
import { verifyToken } from '../middleware/auth.js';
import { supervisorOnly, coordinatorOnly } from '../middleware/rbac.js';

const router = express.Router();

router.use(verifyToken);

// Must come before /:submissionId to avoid conflict
router.post('/student/:userId/generate', coordinatorOnly, generateF6PDFByStudent);

router.get('/:submissionId', getOrCreateF6);
router.put('/:submissionId', supervisorOnly, updateF6Data);
router.post('/:submissionId/sign', supervisorOnly, signF6);
router.post('/:submissionId/generate', coordinatorOnly, generateF6PDF);

export default router;
