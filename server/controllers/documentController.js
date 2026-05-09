import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { OfficialDocument, User, StudentProfile } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getMyDocuments = async (req, res) => {
  try {
    const where = req.user.role === 'student'
      ? { student_id: req.user.id }
      : { supervisor_id: req.user.id };

    const docs = await OfficialDocument.findAll({
      where,
      order: [['generated_at', 'DESC']]
    });

    res.json({ success: true, data: docs });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const downloadDocument = async (req, res) => {
  try {
    const doc = await OfficialDocument.findByPk(req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    const isAllowed = doc.student_id === req.user.id || doc.supervisor_id === req.user.id;
    if (!isAllowed) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const filePath = path.join(__dirname, '../uploads', doc.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found.' });
    }

    res.download(filePath, path.basename(doc.file_path));
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
