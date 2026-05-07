import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import patientPrescriptionRoutes from './routes/patientPrescriptionRoutes.js';
import privateDoctorNoteRoutes from './routes/privateDoctorNoteRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/patient-prescriptions', patientPrescriptionRoutes);
app.use('/api/private-doctor-notes', privateDoctorNoteRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
