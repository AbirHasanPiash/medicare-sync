import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getPatientName = (patient) => {
  if (!patient) return 'Unknown patient';
  return (
    `${patient.firstName || ''} ${patient.lastName || ''}`.trim() ||
    patient.email
  );
};

const getDoctorName = (doctor) => {
  if (!doctor) return 'Unknown doctor';
  const name = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
  return name ? `Dr. ${name}` : 'Unknown doctor';
};

const sameUtcDay = (left, right) => {
  const leftDate = new Date(left);
  const rightDate = new Date(right);

  return (
    leftDate.getUTCFullYear() === rightDate.getUTCFullYear() &&
    leftDate.getUTCMonth() === rightDate.getUTCMonth() &&
    leftDate.getUTCDate() === rightDate.getUTCDate()
  );
};

export const getHistoryPatients = async (req, res) => {
  try {
    const patients = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        patientProfile: {
          select: {
            dateOfBirth: true,
            bloodGroup: true,
            gender: true,
            allergies: true,
          },
        },
        appointmentsAsPatient: {
          select: {
            date: true,
            status: true,
          },
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: { firstName: 'asc' },
    });

    res.status(200).json(
      patients.map((patient) => ({
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        patientProfile: patient.patientProfile,
        latestVisit: patient.appointmentsAsPatient[0] || null,
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch patients for history.' });
  }
};

export const getPatientMedicalHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 50);
    const status = String(req.query.status || 'ALL').toUpperCase();
    const skip = (page - 1) * limit;

    const patient = await prisma.user.findFirst({
      where: { id: patientId, role: 'PATIENT' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        patientProfile: {
          select: {
            dateOfBirth: true,
            bloodGroup: true,
            gender: true,
            allergies: true,
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const where = {
      patientId,
      ...(status !== 'ALL' ? { status } : {}),
    };

    const [appointments, total, documents] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          doctor: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              doctorProfile: {
                select: { specialization: true },
              },
            },
          },
          medicalRecord: {
            select: {
              id: true,
              diagnosis: true,
              symptoms: true,
              treatmentPlan: true,
              createdAt: true,
              updatedAt: true,
              prescriptions: {
                select: {
                  id: true,
                  medicineName: true,
                  dosage: true,
                  frequency: true,
                  duration: true,
                  instructions: true,
                },
              },
            },
          },
        },
        orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
      prisma.document.findMany({
        where: { patientId },
        select: {
          id: true,
          title: true,
          fileUrl: true,
          documentType: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const records = appointments.map((appointment) => {
      const prescriptions = appointment.medicalRecord?.prescriptions || [];
      const relatedAttachments = documents.filter((document) =>
        sameUtcDay(document.createdAt, appointment.date)
      );

      return {
        id: appointment.id,
        visitDate: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        reason: appointment.reason,
        type: appointment.type,
        location: appointment.location,
        doctorName: getDoctorName(appointment.doctor),
        doctorSpecialization:
          appointment.doctor?.doctorProfile?.specialization || null,
        diagnosis: appointment.medicalRecord?.diagnosis || null,
        symptoms: appointment.medicalRecord?.symptoms || [],
        treatmentPlan: appointment.medicalRecord?.treatmentPlan || null,
        prescriptionSummary:
          prescriptions.length > 0
            ? prescriptions
                .map(
                  (item) =>
                    `${item.medicineName} ${item.dosage} (${item.frequency})`
                )
                .join(', ')
            : null,
        prescriptions,
        attachments: relatedAttachments,
      };
    });

    res.status(200).json({
      patient: {
        id: patient.id,
        name: getPatientName(patient),
        email: patient.email,
        profile: patient.patientProfile,
      },
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        status,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch patient medical history.' });
  }
};
