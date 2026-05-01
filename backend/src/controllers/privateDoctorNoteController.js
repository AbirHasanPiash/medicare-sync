import { PrismaClient } from '@prisma/client';
import { MongoClient, ObjectId } from 'mongodb';

const prisma = new PrismaClient();
let mongoClient;
let notesCollectionPromise;

const getNotesCollection = async () => {
  if (!notesCollectionPromise) {
    notesCollectionPromise = (async () => {
      mongoClient = mongoClient || new MongoClient(process.env.DATABASE_URL);
      await mongoClient.connect();

      const dbName =
        new URL(process.env.DATABASE_URL).pathname.replace('/', '') ||
        undefined;
      const collection = mongoClient.db(dbName).collection('PrivateDoctorNote');

      await collection.createIndex({
        doctorId: 1,
        patientId: 1,
        createdAt: -1,
      });
      await collection.createIndex({ appointmentId: 1 });

      return collection;
    })();
  }

  return notesCollectionPromise;
};

const sanitizeContent = (content) => String(content || '').trim();

const toObjectId = (id) => {
  if (!id || !ObjectId.isValid(id)) return null;
  return new ObjectId(id);
};

const serializeNote = (note, appointmentsById = new Map()) => {
  const appointmentId = note.appointmentId?.toString();

  return {
    id: note._id.toString(),
    doctorId: note.doctorId.toString(),
    patientId: note.patientId.toString(),
    appointmentId: appointmentId || null,
    content: note.content,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    appointment: appointmentId
      ? appointmentsById.get(appointmentId) || null
      : null,
  };
};

const attachAppointmentContext = async (notes) => {
  const appointmentIds = [
    ...new Set(
      notes.map((note) => note.appointmentId?.toString()).filter(Boolean)
    ),
  ];

  if (appointmentIds.length === 0) {
    return notes.map((note) => serializeNote(note));
  }

  const appointments = await prisma.appointment.findMany({
    where: { id: { in: appointmentIds } },
    select: {
      id: true,
      date: true,
      startTime: true,
      status: true,
      reason: true,
    },
  });

  const appointmentsById = new Map(
    appointments.map((appointment) => [appointment.id, appointment])
  );
  return notes.map((note) => serializeNote(note, appointmentsById));
};

const ensureDoctorCanAccessPatient = async ({ doctorId, patientId }) => {
  const appointment = await prisma.appointment.findFirst({
    where: { doctorId, patientId },
    select: { id: true },
  });

  return Boolean(appointment);
};

const validateAppointmentContext = async ({
  doctorId,
  patientId,
  appointmentId,
}) => {
  if (!appointmentId) return true;

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      doctorId,
      patientId,
    },
    select: { id: true },
  });

  return Boolean(appointment);
};

export const getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const appointments = await prisma.appointment.findMany({
      where: { doctorId },
      include: {
        patient: {
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
        },
      },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    });

    const patientMap = new Map();

    for (const appointment of appointments) {
      if (!appointment.patient || patientMap.has(appointment.patientId))
        continue;

      patientMap.set(appointment.patientId, {
        ...appointment.patient,
        latestVisit: {
          id: appointment.id,
          date: appointment.date,
          status: appointment.status,
          startTime: appointment.startTime,
        },
      });
    }

    res.status(200).json(Array.from(patientMap.values()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch doctor patients.' });
  }
};

export const getPatientVisitsForNotes = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { patientId } = req.params;

    const canAccess = await ensureDoctorCanAccessPatient({
      doctorId,
      patientId,
    });
    if (!canAccess) {
      return res
        .status(403)
        .json({ error: 'You can only view visits for your own patients.' });
    }

    const visits = await prisma.appointment.findMany({
      where: { doctorId, patientId },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        reason: true,
        type: true,
      },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    });

    res.status(200).json(visits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch patient visits.' });
  }
};

export const getPrivateDoctorNotes = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { patientId } = req.params;
    const doctorObjectId = toObjectId(doctorId);
    const patientObjectId = toObjectId(patientId);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;

    if (!doctorObjectId || !patientObjectId) {
      return res.status(400).json({ error: 'Invalid patient context.' });
    }

    const canAccess = await ensureDoctorCanAccessPatient({
      doctorId,
      patientId,
    });
    if (!canAccess) {
      return res
        .status(403)
        .json({ error: 'You can only view notes for your own patients.' });
    }

    const notesCollection = await getNotesCollection();
    const query = { doctorId: doctorObjectId, patientId: patientObjectId };

    const [rawNotes, total] = await Promise.all([
      notesCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      notesCollection.countDocuments(query),
    ]);

    const notes = await attachAppointmentContext(rawNotes);

    res.status(200).json({
      notes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch private doctor notes.' });
  }
};

export const createPrivateDoctorNote = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { patientId, appointmentId } = req.body;
    const content = sanitizeContent(req.body.content);
    const doctorObjectId = toObjectId(doctorId);
    const patientObjectId = toObjectId(patientId);
    const appointmentObjectId = appointmentId
      ? toObjectId(appointmentId)
      : null;

    if (!patientId) {
      return res.status(400).json({ error: 'patientId is required.' });
    }

    if (
      !doctorObjectId ||
      !patientObjectId ||
      (appointmentId && !appointmentObjectId)
    ) {
      return res.status(400).json({ error: 'Invalid note context.' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Note content is required.' });
    }

    const canAccess = await ensureDoctorCanAccessPatient({
      doctorId,
      patientId,
    });
    if (!canAccess) {
      return res
        .status(403)
        .json({ error: 'You can only add notes for your own patients.' });
    }

    const validAppointment = await validateAppointmentContext({
      doctorId,
      patientId,
      appointmentId,
    });
    if (!validAppointment) {
      return res
        .status(400)
        .json({ error: 'Selected visit does not belong to this patient.' });
    }

    const notesCollection = await getNotesCollection();
    const now = new Date();
    const insertResult = await notesCollection.insertOne({
      doctorId: doctorObjectId,
      patientId: patientObjectId,
      appointmentId: appointmentObjectId,
      content,
      createdAt: now,
      updatedAt: now,
    });

    const [note] = await attachAppointmentContext([
      {
        _id: insertResult.insertedId,
        doctorId: doctorObjectId,
        patientId: patientObjectId,
        appointmentId: appointmentObjectId,
        content,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    res.status(201).json({ message: 'Private note saved.', note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save private doctor note.' });
  }
};

export const updatePrivateDoctorNote = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { noteId } = req.params;
    const content = sanitizeContent(req.body.content);
    const doctorObjectId = toObjectId(doctorId);
    const noteObjectId = toObjectId(noteId);

    if (!content) {
      return res.status(400).json({ error: 'Note content is required.' });
    }

    if (!doctorObjectId || !noteObjectId) {
      return res.status(400).json({ error: 'Invalid private note.' });
    }

    const notesCollection = await getNotesCollection();
    const existingNote = await notesCollection.findOne({ _id: noteObjectId });

    if (!existingNote) {
      return res.status(404).json({ error: 'Private note not found.' });
    }

    if (!existingNote.doctorId.equals(doctorObjectId)) {
      return res
        .status(403)
        .json({ error: 'You can only update your own private notes.' });
    }

    const updatedAt = new Date();
    await notesCollection.updateOne(
      {
        _id: noteObjectId,
        doctorId: doctorObjectId,
      },
      {
        $set: { content, updatedAt },
      }
    );

    const updatedNote = await notesCollection.findOne({ _id: noteObjectId });
    const [note] = await attachAppointmentContext([updatedNote]);

    res.status(200).json({ message: 'Private note updated.', note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update private doctor note.' });
  }
};

export const deletePrivateDoctorNote = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { noteId } = req.params;
    const doctorObjectId = toObjectId(doctorId);
    const noteObjectId = toObjectId(noteId);

    if (!doctorObjectId || !noteObjectId) {
      return res.status(400).json({ error: 'Invalid private note.' });
    }

    const notesCollection = await getNotesCollection();
    const existingNote = await notesCollection.findOne({ _id: noteObjectId });

    if (!existingNote) {
      return res.status(404).json({ error: 'Private note not found.' });
    }

    if (!existingNote.doctorId.equals(doctorObjectId)) {
      return res
        .status(403)
        .json({ error: 'You can only delete your own private notes.' });
    }

    await notesCollection.deleteOne({
      _id: noteObjectId,
      doctorId: doctorObjectId,
    });

    res.status(200).json({ message: 'Private note deleted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete private doctor note.' });
  }
};
