import express from 'express';
import {
  createPrivateDoctorNote,
  deletePrivateDoctorNote,
  getDoctorPatients,
  getPatientVisitsForNotes,
  getPrivateDoctorNotes,
  updatePrivateDoctorNote,
} from '../controllers/privateDoctorNoteController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken, requireRole(['DOCTOR']));

router.get('/patients', getDoctorPatients);
router.get('/patients/:patientId/visits', getPatientVisitsForNotes);
router.get('/patients/:patientId/notes', getPrivateDoctorNotes);
router.post('/', createPrivateDoctorNote);
router.put('/:noteId', updatePrivateDoctorNote);
router.delete('/:noteId', deletePrivateDoctorNote);

export default router;
