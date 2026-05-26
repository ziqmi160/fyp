import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  uploadPlagiarismCheck,
  getPlagiarismChecks,
  reviewPlagiarismCheck,
  getMyPlagiarismChecks
} from '../controllers/plagiarismCheckController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/plagiarism'),
  filename: (req, file, cb) => {
    cb(null, `plagiarism-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();

router.use(verifyToken);

router.post('/:submission_id/upload', upload.single('report'), uploadPlagiarismCheck);
router.get('/my-checks', getMyPlagiarismChecks);
router.get('/', requireRole('coordinator'), getPlagiarismChecks);
router.put('/:id/review', requireRole('coordinator'), reviewPlagiarismCheck);

export default router;
