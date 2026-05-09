import express from 'express';
import { createMeeting, getMyMeetings, getMeeting, updateMeeting, cancelMeeting } from '../controllers/meetingController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', createMeeting);
router.get('/my', getMyMeetings);
router.get('/:id', getMeeting);
router.put('/:id', updateMeeting);
router.delete('/:id', cancelMeeting);

export default router;
