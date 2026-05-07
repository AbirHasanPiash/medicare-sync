import express from 'express';
import { downloadPatientPrescription } from '../controllers/patientPrescriptionController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get(
  '/:appointmentId/download',
  verifyToken,
  requireRole(['PATIENT']),
  downloadPatientPrescription
);

export default router;
