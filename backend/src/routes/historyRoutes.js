import express from 'express';
import {
  getHistoryPatients,
  getPatientMedicalHistory,
} from '../controllers/historyController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken, requireRole(['DOCTOR']));

router.get('/patients', getHistoryPatients);
router.get('/:patientId', getPatientMedicalHistory);

export default router;
