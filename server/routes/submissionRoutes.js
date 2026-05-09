import express from 'express';
import { createSubmission, getMySubmissions, getPendingSubmissions, getSubmission, reviewSubmission } from '../controllers/submissionController.js';
import { verifyToken } from '../middleware/auth.js';
import { studentOnly, supervisorOnly } from '../middleware/rbac.js';
import { uploadSubmissions } from '../middleware/upload.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', studentOnly, uploadSubmissions.array('files', 5), createSubmission);
router.get('/my', studentOnly, getMySubmissions);
router.get('/pending', supervisorOnly, getPendingSubmissions);
router.get('/:id', getSubmission);
router.put('/:id/review', supervisorOnly, reviewSubmission);

export default router;
