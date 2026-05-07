import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import multer from 'multer';
import {
  deleteDocument,
  getMyDocuments,
  getPatientDocumentsForDoctor,
  serveDocumentFile,
  uploadDocument,
} from '../controllers/documentController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, '../../uploads/documents');

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    fs.mkdirSync(uploadsRoot, { recursive: true });
    callback(null, uploadsRoot);
  },
  filename: (_req, file, callback) => {
    const safeBaseName = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-z0-9_-]/gi, '-')
      .slice(0, 60);
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${safeBaseName || 'document'}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(
        new Error('Only PDF, JPG, PNG, and WEBP files are allowed.')
      );
    }

    callback(null, true);
  },
});

const handleUploadErrors = (error, _req, res, next) => {
  if (!error) return next();

  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size must be 10MB or less.' });
  }

  return res.status(400).json({ error: error.message || 'Invalid upload.' });
};

router.get('/my', verifyToken, requireRole(['PATIENT']), getMyDocuments);
router.post(
  '/upload',
  verifyToken,
  requireRole(['PATIENT']),
  upload.single('document'),
  handleUploadErrors,
  uploadDocument
);
router.get(
  '/patients/:patientId',
  verifyToken,
  requireRole(['DOCTOR']),
  getPatientDocumentsForDoctor
);
router.delete(
  '/:documentId',
  verifyToken,
  requireRole(['PATIENT']),
  deleteDocument
);
router.get(
  '/files/:filename',
  verifyToken,
  requireRole(['PATIENT', 'DOCTOR']),
  serveDocumentFile
);

export default router;
