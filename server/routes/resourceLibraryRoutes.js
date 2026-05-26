import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import {
  getResourceLibrary,
  createResource,
  updateResource,
  deleteResource
} from '../controllers/resourceLibraryController.js';

const router = express.Router();

router.get('/', getResourceLibrary);

router.post('/', verifyToken, requireRole('coordinator'), createResource);
router.put('/:id', verifyToken, requireRole('coordinator'), updateResource);
router.delete('/:id', verifyToken, requireRole('coordinator'), deleteResource);

export default router;
