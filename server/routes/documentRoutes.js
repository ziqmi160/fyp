import express from 'express';
import { getMyDocuments, downloadDocument } from '../controllers/documentController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/my', getMyDocuments);
router.get('/:id/download', downloadDocument);

export default router;
