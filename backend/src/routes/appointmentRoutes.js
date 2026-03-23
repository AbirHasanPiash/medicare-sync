import express from 'express';
import { 
  getDoctorsDirectory, 
  getAvailableSlots, 
  bookAppointment, 
  getMyAppointments, 
  updateAppointmentStatus,
  getBlockedDates,
  addBlockedDate,
  deleteBlockedDate,
  getAvailabilities,
  addAvailability,
  deleteAvailability
} from '../controllers/appointmentController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Publicly accessible to logged-in users (Patients browsing for doctors)
router.get('/doctors', verifyToken, getDoctorsDirectory);
router.get('/slots', verifyToken, getAvailableSlots);

// Booking and Viewing
router.post('/book', verifyToken, requireRole(['PATIENT']), bookAppointment);
router.get('/my-appointments', verifyToken, getMyAppointments);

// Updating (Cancel/Reschedule)
router.put('/:appointmentId', verifyToken, updateAppointmentStatus);

router.get('/blocks', verifyToken, requireRole(['DOCTOR']), getBlockedDates);
router.post('/blocks', verifyToken, requireRole(['DOCTOR']), addBlockedDate);
router.delete('/blocks/:id', verifyToken, requireRole(['DOCTOR']), deleteBlockedDate);

router.get('/availabilities', verifyToken, requireRole(['DOCTOR']), getAvailabilities);
router.post('/availabilities', verifyToken, requireRole(['DOCTOR']), addAvailability);
router.delete('/availabilities/:id', verifyToken, requireRole(['DOCTOR']), deleteAvailability);

export default router;