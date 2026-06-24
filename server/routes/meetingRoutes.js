import express from 'express';
import {
  createMeeting, getMyMeetings, getMeeting, updateMeeting, cancelMeeting,
  updateF5Data, signMeeting, getStudentF5, getMyF5, generateF5PDF, downloadMyF5PDF,
  downloadStudentF5ForCoordinator
} from '../controllers/meetingController.js';
import { verifyToken } from '../middleware/auth.js';
import { supervisorOnly, studentOnly, coordinatorOnly } from '../middleware/rbac.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', createMeeting);
router.get('/my', getMyMeetings);

// F5 routes — must come before /:id to avoid conflict
router.get('/my/f5', studentOnly, getMyF5);
router.get('/my/f5/download', studentOnly, downloadMyF5PDF);
router.get('/f5/:studentId', supervisorOnly, getStudentF5);
router.post('/f5/:studentId/generate', supervisorOnly, generateF5PDF);
router.get('/coordinator/f5/:studentId/download', coordinatorOnly, downloadStudentF5ForCoordinator);

router.get('/:id', getMeeting);
router.put('/:id', updateMeeting);
router.put('/:id/f5', updateF5Data);
router.post('/:id/sign', supervisorOnly, signMeeting);
router.delete('/:id', cancelMeeting);

export default router;
