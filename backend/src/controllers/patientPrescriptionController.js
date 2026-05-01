import { PrismaClient } from '@prisma/client';
import { generatePrescriptionPDFBuffer } from '../utils/generatePrescriptionPDF.js';

const prisma = new PrismaClient();

export const downloadPatientPrescription = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { firstName: true, lastName: true, email: true } },
        doctor: { select: { firstName: true, lastName: true } },
        medicalRecord: {
          include: {
            prescriptions: true,
          },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    if (appointment.patientId !== patientId) {
      return res
        .status(403)
        .json({ error: 'You can only download your own prescriptions.' });
    }

    if (
      !appointment.medicalRecord ||
      appointment.medicalRecord.prescriptions.length === 0
    ) {
      return res
        .status(404)
        .json({ error: 'Prescription not found for this appointment.' });
    }

    const prescriptionPayload = {
      patientName:
        `${appointment.patient?.firstName || ''} ${appointment.patient?.lastName || ''}`.trim() ||
        'N/A',
      patientEmail: appointment.patient?.email || 'N/A',
      visitDate: new Date(appointment.date).toLocaleDateString('en-GB'),
      doctorName:
        `${appointment.doctor?.firstName || ''} ${appointment.doctor?.lastName || ''}`.trim() ||
        'N/A',
      diagnosis: appointment.medicalRecord.diagnosis || 'N/A',
      symptoms: Array.isArray(appointment.medicalRecord.symptoms)
        ? appointment.medicalRecord.symptoms.join(', ')
        : appointment.medicalRecord.symptoms || 'N/A',
      medications: appointment.medicalRecord.prescriptions.map((item) => ({
        medicineName: item.medicineName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions,
      })),
    };

    const pdfBuffer = await generatePrescriptionPDFBuffer(prescriptionPayload);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="prescription-${appointmentId}.pdf"`
    );

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to download prescription.' });
  }
};
