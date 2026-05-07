import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardOverview = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    if (role === 'PATIENT') return await getPatientDashboard(userId, res);
    if (role === 'DOCTOR') return await getDoctorDashboard(userId, res);

    return res.json({
      role,
      message: 'Dashboard not configured for this role.',
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
};

const getPatientDashboard = async (userId, res) => {
  const [user, appointments, documentCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
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
    }),
    prisma.appointment.findMany({
      where: { patientId: userId },
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            doctorProfile: { select: { specialization: true } },
          },
        },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.document.count({ where: { patientId: userId } }),
  ]);

  const upcoming = appointments.filter((a) =>
    ['SCHEDULED', 'RESCHEDULED'].includes(a.status)
  );
  const completed = appointments.filter((a) => a.status === 'COMPLETED');
  const cancelled = appointments.filter((a) => a.status === 'CANCELLED');

  res.json({
    role: 'PATIENT',
    profile: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      dateOfBirth: user.patientProfile?.dateOfBirth ?? null,
      bloodGroup: user.patientProfile?.bloodGroup ?? null,
      gender: user.patientProfile?.gender ?? null,
      allergies: user.patientProfile?.allergies ?? [],
    },
    stats: {
      totalAppointments: appointments.length,
      upcomingCount: upcoming.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      documentCount,
    },
    upcomingAppointments: upcoming.slice(0, 3),
    recentAppointments: [...completed].reverse().slice(0, 3),
  });
};

const getDoctorDashboard = async (userId, res) => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    user,
    todayAppointments,
    upcomingAppointments,
    uniquePatients,
    completedCount,
    upcomingCount,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        doctorProfile: { select: { specialization: true, slotDuration: true } },
      },
    }),
    prisma.appointment.findMany({
      where: { doctorId: userId, date: { gte: todayStart, lte: todayEnd } },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            patientProfile: { select: { bloodGroup: true, gender: true } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    }),
    prisma.appointment.findMany({
      where: {
        doctorId: userId,
        status: { in: ['SCHEDULED', 'RESCHEDULED'] },
        date: { gt: todayEnd },
      },
      include: {
        patient: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { date: 'asc' },
      take: 5,
    }),
    prisma.appointment.findMany({
      where: { doctorId: userId },
      distinct: ['patientId'],
      select: { patientId: true },
    }),
    prisma.appointment.count({
      where: { doctorId: userId, status: 'COMPLETED' },
    }),
    prisma.appointment.count({
      where: {
        doctorId: userId,
        status: { in: ['SCHEDULED', 'RESCHEDULED'] },
        date: { gt: todayEnd },
      },
    }),
  ]);

  res.json({
    role: 'DOCTOR',
    profile: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      specialization: user.doctorProfile?.specialization ?? 'General',
      slotDuration: user.doctorProfile?.slotDuration ?? 30,
    },
    stats: {
      todayCount: todayAppointments.length,
      todayScheduledCount: todayAppointments.filter((a) =>
        ['SCHEDULED', 'RESCHEDULED'].includes(a.status)
      ).length,
      totalPatients: uniquePatients.length,
      upcomingCount,
      completedCount,
    },
    todayAppointments,
    upcomingAppointments,
  });
};
