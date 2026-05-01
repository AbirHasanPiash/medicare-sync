import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, '../../uploads/documents');

const allowedDocumentTypes = new Set([
  'LAB_REPORT',
  'X_RAY',
  'PRESCRIPTION',
  'OTHER',
]);

const ensureDoctorCanAccessPatient = async ({ doctorId, patientId }) => {
  const appointment = await prisma.appointment.findFirst({
    where: { doctorId, patientId },
    select: { id: true },
  });

  return Boolean(appointment);
};

const serializeDocument = (document) => ({
  id: document.id,
  patientId: document.patientId,
  uploaderId: document.uploaderId,
  title: document.title,
  fileUrl: document.fileUrl,
  documentType: document.documentType,
  createdAt: document.createdAt,
  patient: document.patient,
  uploader: document.uploader,
});

const getStoredFilename = (fileUrl) => {
  const filename = path.basename(fileUrl || '');
  return filename && filename !== '.' ? filename : null;
};

const removeUploadedFile = async (fileUrl) => {
  const filename = getStoredFilename(fileUrl);
  if (!filename) return;

  const targetPath = path.resolve(uploadsRoot, filename);
  if (!targetPath.startsWith(uploadsRoot)) return;

  try {
    await fs.unlink(targetPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to remove uploaded document file:', error);
    }
  }
};

export const getMyDocuments = async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: { patientId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(documents.map(serializeDocument));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch documents.' });
  }
};

export const getPatientDocumentsForDoctor = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { patientId } = req.params;

    const canAccess = await ensureDoctorCanAccessPatient({
      doctorId,
      patientId,
    });
    if (!canAccess) {
      return res
        .status(403)
        .json({ error: 'You can only view documents for your own patients.' });
    }

    const documents = await prisma.document.findMany({
      where: { patientId },
      include: {
        uploader: { select: { firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(documents.map(serializeDocument));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch patient documents.' });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    const { title, documentType } = req.body;
    const cleanTitle = String(title || '').trim();
    const cleanType = String(documentType || '')
      .trim()
      .toUpperCase();

    if (!req.file) {
      return res.status(400).json({ error: 'Please select a file to upload.' });
    }

    if (!cleanTitle) {
      await removeUploadedFile(req.file.filename);
      return res.status(400).json({ error: 'Document title is required.' });
    }

    if (!allowedDocumentTypes.has(cleanType)) {
      await removeUploadedFile(req.file.filename);
      return res.status(400).json({ error: 'Invalid document category.' });
    }

    const document = await prisma.document.create({
      data: {
        patientId: req.user.id,
        uploaderId: req.user.id,
        title: cleanTitle,
        documentType: cleanType,
        fileUrl: `/documents/files/${req.file.filename}`,
      },
    });

    res.status(201).json({
      message: 'Document uploaded successfully.',
      document: serializeDocument(document),
    });
  } catch (error) {
    console.error(error);
    if (req.file) {
      await removeUploadedFile(req.file.filename);
    }
    res.status(500).json({ error: 'Failed to upload document.' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    if (document.patientId !== req.user.id) {
      return res
        .status(403)
        .json({ error: 'You can only delete your own documents.' });
    }

    await prisma.document.delete({ where: { id: documentId } });
    await removeUploadedFile(document.fileUrl);

    res.status(200).json({ message: 'Document deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete document.' });
  }
};

export const serveDocumentFile = async (req, res) => {
  try {
    const { filename } = req.params;

    const document = await prisma.document.findFirst({
      where: { fileUrl: `/documents/files/${filename}` },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    if (req.user.role === 'PATIENT' && document.patientId !== req.user.id) {
      return res
        .status(403)
        .json({ error: 'You can only access your own documents.' });
    }

    if (req.user.role === 'DOCTOR') {
      const canAccess = await ensureDoctorCanAccessPatient({
        doctorId: req.user.id,
        patientId: document.patientId,
      });

      if (!canAccess) {
        return res
          .status(403)
          .json({
            error: 'You can only access documents for your own patients.',
          });
      }
    }

    if (!['PATIENT', 'DOCTOR'].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: 'Unauthorized access for this role.' });
    }

    const safeFilename = path.basename(filename);
    const filePath = path.resolve(uploadsRoot, safeFilename);

    if (!filePath.startsWith(uploadsRoot)) {
      return res.status(400).json({ error: 'Invalid file path.' });
    }

    const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${safeFilename}"`
    );
    return res.sendFile(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to access document file.' });
  }
};
