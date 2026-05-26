import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  uploadDeliverable,
  getDeliverables,
  getMyDeliverables,
  deleteDeliverable,
  getSubmissionDeliverableStatus
} from '../controllers/deliverableController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/deliverables'),
  filename: (req, file, cb) => {
    cb(null, `deliverable-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = express.Router();

router.use(verifyToken);

router.post('/', upload.single('file'), uploadDeliverable);
router.get('/submission/:submission_id/my', getMyDeliverables);
router.get('/submission/:submission_id/status', getSubmissionDeliverableStatus);
router.get('/submission/:submission_id', requireRole('coordinator'), getDeliverables);
router.delete('/:id', deleteDeliverable);

export default router;
