import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PRESCRIPTIONS (Doctor creates, patient views through appointments)
export const upsertPrescription = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const {
      appointmentId,
      diagnosis,
      symptoms,
      treatmentPlan,
      clinicalNotes,
      medications = [],
    } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ error: 'appointmentId is required.' });
    }

    if (!Array.isArray(medications) || medications.length === 0) {
      return res
        .status(400)
        .json({ error: 'At least one medication is required.' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        doctorId: true,
        patientId: true,
        status: true,
        medicalRecord: {
          select: {
            prescriptions: {
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    if (appointment.doctorId !== doctorId) {
      return res
        .status(403)
        .json({ error: 'You can only prescribe for your own appointments.' });
    }

    if (
      !['SCHEDULED', 'RESCHEDULED', 'COMPLETED'].includes(appointment.status)
    ) {
      return res
        .status(400)
        .json({
          error:
            'Prescription can only be created for active or completed appointments.',
        });
    }

    if (appointment.medicalRecord?.prescriptions?.length > 0) {
      return res.status(400).json({
        error:
          'Prescription for this appointment has already been issued. You cannot issue it again.',
      });
    }

    const cleanSymptoms = Array.isArray(symptoms)
      ? symptoms.map((item) => String(item).trim()).filter(Boolean)
      : String(symptoms || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

    const sanitizedMeds = medications
      .map((item) => ({
        medicineName: String(item.medicineName || '').trim(),
        dosage: String(item.dosage || '').trim(),
        frequency: String(item.frequency || '').trim(),
        duration: String(item.duration || '').trim(),
        instructions: item.instructions
          ? String(item.instructions).trim()
          : null,
      }))
      .filter(
        (item) =>
          item.medicineName && item.dosage && item.frequency && item.duration
      );

    if (sanitizedMeds.length === 0) {
      return res
        .status(400)
        .json({ error: 'Medication fields are incomplete.' });
    }

    const medicalRecord = await prisma.medicalRecord.upsert({
      where: { appointmentId },
      update: {
        diagnosis: diagnosis || null,
        symptoms: cleanSymptoms,
        treatmentPlan: treatmentPlan || null,
        clinicalNotes: clinicalNotes || null,
      },
      create: {
        appointmentId,
        patientId: appointment.patientId,
        doctorId,
        diagnosis: diagnosis || null,
        symptoms: cleanSymptoms,
        treatmentPlan: treatmentPlan || null,
        clinicalNotes: clinicalNotes || null,
      },
    });

    await prisma.prescription.deleteMany({
      where: { medicalRecordId: medicalRecord.id },
    });

    await prisma.prescription.createMany({
      data: sanitizedMeds.map((item) => ({
        medicalRecordId: medicalRecord.id,
        medicineName: item.medicineName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions,
      })),
    });

    const medicalRecordWithRelations = await prisma.medicalRecord.findUnique({
      where: { id: medicalRecord.id },
      include: {
        patient: { select: { firstName: true, lastName: true, email: true } },
        doctor: { select: { firstName: true, lastName: true, email: true } },
        prescriptions: true,
        appointment: { select: { id: true, date: true, status: true } },
      },
    });

    res.status(201).json({
      message: 'Prescription saved successfully.',
      medicalRecord: medicalRecordWithRelations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save prescription.' });
  }
};
