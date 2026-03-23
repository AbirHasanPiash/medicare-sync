import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper Function: Convert "09:00" to 540 (minutes) for easy math
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper Function: Convert 540 back to "09:00"
const minutesToTime = (minutes) => {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
};


// DOCTOR DIRECTORY

export const getDoctorsDirectory = async (req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        doctorProfile: {
          select: { specialization: true }
        }
      }
    });
    res.status(200).json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch doctor directory' });
  }
};



// DYNAMIC SLOT CALCULATION (Multi-Location Support)

export const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query; // date format: YYYY-MM-DD
    
    // Timezone-safe date parsing
    const [year, month, day] = date.split('-').map(Number);
    const queryDate = new Date(Date.UTC(year, month - 1, day));
    
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = daysOfWeek[queryDate.getUTCDay()];

    // Fetch the doctor along with ONLY the availability blocks for this specific day
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      include: { 
        doctorProfile: true,
        availabilities: {
          where: { dayOfWeek: dayName }
        }
      }
    });

    if (!doctor || !doctor.doctorProfile) return res.status(404).json({ error: 'Doctor not found' });

    const availabilities = doctor.availabilities;

    // Check if the doctor has any availability blocks scheduled for this day
    if (!availabilities || availabilities.length === 0) {
      return res.status(200).json({ slots: [], message: 'Doctor is not available on this day of the week.' });
    }

    // Set absolute start and end of the day in UTC for accurate DB querying
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    
    // Check if the doctor has manually blocked off this specific date (Leave/Holiday)
    const blocked = await prisma.blockedDate.findFirst({
      where: {
        doctorId,
        date: { gte: startOfDay, lte: endOfDay }
      }
    });

    if (blocked) {
      return res.status(200).json({ slots: [], message: blocked.reason || 'Doctor is on leave this day.' });
    }

    // Fetch all existing, active appointments to calculate overlaps
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ['SCHEDULED', 'RESCHEDULED'] } 
      }
    });

    const duration = doctor.doctorProfile.slotDuration || 30;
    const availableSlots = [];

    // Loop through EVERY availability block (e.g., Morning Clinic vs Afternoon Telehealth)
    for (const block of availabilities) {
      let currentMin = timeToMinutes(block.startTime);
      const endMin = timeToMinutes(block.endTime);
      
      while (currentMin + duration <= endMin) {
        const slotStart = minutesToTime(currentMin);
        const slotEnd = minutesToTime(currentMin + duration);
        
        // Overlap logic: A slot overlaps if it starts before an appointment ends AND ends after an appointment starts
        const isBooked = existingAppointments.some(app => {
          const appStart = timeToMinutes(app.startTime);
          const appEnd = timeToMinutes(app.endTime);
          return currentMin < appEnd && (currentMin + duration) > appStart;
        });

        if (!isBooked) {
          // Attach the dynamic location and type to the slot!
          availableSlots.push({ 
            startTime: slotStart, 
            endTime: slotEnd,
            type: block.type,         // 'IN_PERSON' or 'TELEHEALTH'
            location: block.location  // specific clinic address or null
          });
        }

        currentMin += duration;
      }
    }

    // Sort slots chronologically in case availability blocks were created out of order
    availableSlots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    res.status(200).json({ slots: availableSlots });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to calculate slots' });
  }
};


// BOOK APPOINTMENT

export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime, reason, type, location, meetingLink } = req.body;
    const patientId = req.user.id; 

    // Timezone safe parsing
    const [year, month, day] = date.split('-').map(Number);
    const appointmentDate = new Date(Date.UTC(year, month - 1, day));

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        date: appointmentDate,
        startTime,
        endTime,
        reason,
        status: 'SCHEDULED',
        type: type || 'IN_PERSON',      // Fallback if frontend doesn't send it yet
        location: location || null,
        meetingLink: meetingLink || null
      }
    });

    res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
};


// GET DASHBOARD APPOINTMENTS

export const getMyAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const whereClause = role === 'DOCTOR' ? { doctorId: userId } : { patientId: userId };

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: { select: { firstName: true, lastName: true, email: true } },
        doctor: { select: { firstName: true, lastName: true, doctorProfile: { select: { specialization: true } } } },
        medicalRecord: true // Include EMR data if it exists!
      },
      orderBy: [ { date: 'asc' }, { startTime: 'asc' } ]
    });

    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};


// UPDATE/RESCHEDULE APPOINTMENT

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, date, startTime, endTime, type, location } = req.body;

    let updateData = { status };

    // Safely apply new date if it's a reschedule
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      updateData.date = new Date(Date.UTC(year, month - 1, day));
    }
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;
    if (type) updateData.type = type;
    if (location) updateData.location = location;

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData
    });

    res.status(200).json({ message: `Appointment ${status.toLowerCase()}`, updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};


// LEAVE MANAGEMENT (BLOCKED DATES)
export const getBlockedDates = async (req, res) => {
  try {
    const blockedDates = await prisma.blockedDate.findMany({
      where: { doctorId: req.user.id },
      orderBy: { date: 'asc' }
    });
    res.status(200).json(blockedDates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch blocked dates' });
  }
};

export const addBlockedDate = async (req, res) => {
  try {
    const { date, reason } = req.body;
    
    // Timezone safe boundaries
    const [year, month, day] = date.split('-').map(Number);
    const blockDate = new Date(Date.UTC(year, month - 1, day));
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    // Prevent double-booking a day off
    const existing = await prisma.blockedDate.findFirst({
      where: { 
        doctorId: req.user.id, 
        date: { gte: startOfDay, lte: endOfDay } 
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already blocked off this date.' });
    }

    const newBlock = await prisma.blockedDate.create({
      data: {
        doctorId: req.user.id,
        date: blockDate,
        reason
      }
    });

    res.status(201).json({ message: 'Date blocked successfully', newBlock });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to block date' });
  }
};

export const deleteBlockedDate = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.blockedDate.delete({
      where: { id }
    });
    res.status(200).json({ message: 'Leave cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove blocked date' });
  }
};



// 7. AVAILABILITY MANAGEMENT

export const getAvailabilities = async (req, res) => {
  try {
    const availabilities = await prisma.availability.findMany({
      where: { doctorId: req.user.id },
      orderBy: { startTime: 'asc' }
    });
    res.status(200).json(availabilities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch availabilities' });
  }
};

export const addAvailability = async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, type, location } = req.body;
    
    // Optional: Add logic here to prevent overlapping blocks for the same day
    
    const newBlock = await prisma.availability.create({
      data: {
        doctorId: req.user.id,
        dayOfWeek,
        startTime,
        endTime,
        type,
        location
      }
    });
    res.status(201).json(newBlock);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add availability' });
  }
};

export const deleteAvailability = async (req, res) => {
  try {
    await prisma.availability.delete({
      where: { id: req.params.id }
    });
    res.status(200).json({ message: 'Availability deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete availability' });
  }
};