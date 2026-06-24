import express from 'express';
import { getMyDocuments, getMyF1, getStudentF1, downloadDocument } from '../controllers/documentController.js';
import { verifyToken } from '../middleware/auth.js';
import { coordinatorOnly, studentOnly } from '../middleware/rbac.js';

const router = express.Router();

router.use(verifyToken);

router.get('/my', getMyDocuments);
router.get('/my/f1', studentOnly, getMyF1);
router.get('/student/:studentUserId/f1', coordinatorOnly, getStudentF1);
router.get('/:id/download', downloadDocument);

export default router;
