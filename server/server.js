import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import supervisorRoutes from './routes/supervisorRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import coordinatorRoutes from './routes/coordinatorRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import evaluationRoutes from './routes/evaluationRoutes.js';
import phaseRoutes from './routes/phases.js';
import examinerAssignmentRoutes from './routes/examinerAssignments.js';
import evaluationFormRoutes from './routes/evaluationForms.js';
import progressTrackerRoutes from './routes/progressTracker.js';
import presentationSessionRoutes from './routes/presentationSessions.js';
import amendmentRoutes from './routes/amendments.js';
import consultationRoutes from './routes/consultations.js';
import reportDistributionRoutes from './routes/reportDistribution.js';
import marksRoutes from './routes/marks.js';
import resourceLibraryRoutes from './routes/resourceLibraryRoutes.js';
import plagiarismCheckRoutes from './routes/plagiarismCheckRoutes.js';
import ethicalApprovalRoutes from './routes/ethicalApprovalRoutes.js';
import deliverableRoutes from './routes/deliverableRoutes.js';
import exhibitionRoutes from './routes/exhibitionRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { warmUp } from './services/embeddingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/supervisors', supervisorRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/phases', phaseRoutes);
app.use('/api/examiner-assignments', examinerAssignmentRoutes);
app.use('/api/evaluation-forms', evaluationFormRoutes);
app.use('/api/progress', progressTrackerRoutes);
app.use('/api/presentation-sessions', presentationSessionRoutes);
app.use('/api/amendments', amendmentRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/report-distribution', reportDistributionRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/resource-library', resourceLibraryRoutes);
app.use('/api/plagiarism-checks', plagiarismCheckRoutes);
app.use('/api/ethical-approval', ethicalApprovalRoutes);
app.use('/api/deliverables', deliverableRoutes);
app.use('/api/exhibitions', exhibitionRoutes);
app.use('/api/tasks', taskRoutes);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File too large. Max 10MB.' });
    }
  }
  if (err.message?.includes('Invalid file type')) {
    return res.status(400).json({ success: false, error: err.message });
  }
  console.error(err);
  res.status(500).json({ success: false, error: 'Server error.' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  warmUp();
});
