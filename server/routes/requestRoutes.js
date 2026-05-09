import express from 'express';
import { createRequest, getIncomingRequests, getMyRequests, acceptRequest, rejectRequest } from '../controllers/requestController.js';
import { verifyToken } from '../middleware/auth.js';
import { studentOnly, supervisorOnly } from '../middleware/rbac.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', studentOnly, createRequest);
router.get('/incoming', supervisorOnly, getIncomingRequests);
router.get('/my', studentOnly, getMyRequests);
router.put('/:id/accept', supervisorOnly, acceptRequest);
router.put('/:id/reject', supervisorOnly, rejectRequest);

export default router;
