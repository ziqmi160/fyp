import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getEthicalApprovalStatus,
  submitRecForm,
  getAllEthicalApprovals,
  updateEthicalApprovalStatus,
  setEthicalApprovalRequired
} from '../controllers/ethicalApprovalController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/ethical'),
  filename: (req, file, cb) => {
    cb(null, `rec-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();

router.use(verifyToken);

router.get('/my-approval', getEthicalApprovalStatus);
router.post('/submit-rec', upload.single('recForm'), submitRecForm);

router.get('/', requireRole('coordinator'), getAllEthicalApprovals);
router.put('/:student_id/status', requireRole('coordinator'), updateEthicalApprovalStatus);
router.put('/:student_id/requirement', requireRole('coordinator'), setEthicalApprovalRequired);

export default router;
