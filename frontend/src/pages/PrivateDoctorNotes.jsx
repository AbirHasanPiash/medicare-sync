import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import {
  Calendar,
  Edit3,
  FileLock2,
  Loader2,
  Save,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import api, { fetcher } from '../utils/api';
import ConfirmationModal from '../components/ConfirmationModal';
import MedicalDocuments from './MedicalDocuments';

const formatDate = (dateString) => {
  if (!dateString) return 'No date';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'No date';
  return new Date(dateString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getPatientName = (patient) => {
  if (!patient) return 'Select a patient';
  return (
    `${patient.firstName || ''} ${patient.lastName || ''}`.trim() ||
    patient.email
  );
};

const PrivateDoctorNotes = () => {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [editingNoteId, setEditingNoteId] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: patients = [],
    isLoading: loadingPatients,
    error: patientsError,
  } = useSWR('/private-doctor-notes/patients', fetcher);

  const selectedPatient = useMemo(() => {
    return patients.find((patient) => patient.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  const filteredPatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return patients;

    return patients.filter((patient) => {
      const searchable =
        `${patient.firstName || ''} ${patient.lastName || ''} ${patient.email || ''}`.toLowerCase();
      return searchable.includes(query);
    });
  }, [patients, searchTerm]);

  const { data: visits = [], isLoading: loadingVisits } = useSWR(
    selectedPatientId
      ? `/private-doctor-notes/patients/${selectedPatientId}/visits`
      : null,
    fetcher
  );

  const {
    data: notesData,
    isLoading: loadingNotes,
    mutate: mutateNotes,
  } = useSWR(
    selectedPatientId
      ? `/private-doctor-notes/patients/${selectedPatientId}/notes?page=${page}&limit=8`
      : null,
    fetcher
  );

  const notes = notesData?.notes || [];
  const pagination = notesData?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
  };

  useEffect(() => {
    setPage(1);
    setAppointmentId('');
    setContent('');
    setEditingNoteId('');
    setEditingContent('');
  }, [selectedPatientId]);

  const handleSaveNote = async (event) => {
    event.preventDefault();

    if (!selectedPatientId) {
      toast.error('Please select a patient first.');
      return;
    }

    if (!content.trim()) {
      toast.error('Please write a note before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/private-doctor-notes', {
        patientId: selectedPatientId,
        appointmentId: appointmentId || null,
        content,
      });
      setContent('');
      setAppointmentId('');
      setPage(1);
      await mutateNotes();
      toast.success('Private note saved.');
    } catch (error) {
      toast.error(
        error.response?.data?.error || 'Failed to save private note.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (note) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId('');
    setEditingContent('');
  };

  const handleUpdateNote = async (noteId) => {
    if (!editingContent.trim()) {
      toast.error('Note content cannot be empty.');
      return;
    }

    try {
      await api.put(`/private-doctor-notes/${noteId}`, {
        content: editingContent,
      });
      cancelEditing();
      await mutateNotes();
      toast.success('Private note updated.');
    } catch (error) {
      toast.error(
        error.response?.data?.error || 'Failed to update private note.'
      );
    }
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    setIsDeleting(true);
    try {
      await api.delete(`/private-doctor-notes/${noteToDelete.id}`);
      setNoteToDelete(null);
      await mutateNotes();
      toast.success('Private note deleted.');
    } catch (error) {
      toast.error(
        error.response?.data?.error || 'Failed to delete private note.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 font-sans">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-700">
            <FileLock2 className="h-4 w-4" />
            Doctor-only workspace
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Private Doctor Notes
          </h1>
          <p className="mt-2 max-w-3xl text-base font-medium text-slate-500">
            Record confidential diagnostic observations tied to a patient and
            optional visit.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Hidden from patient-facing APIs
        </div>
      </div>

      {patientsError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          Failed to load your patients.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-4 xl:col-span-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/40">
            <div className="mb-4">
              <h2 className="text-lg font-extrabold text-slate-900">
                Patients
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Patients from your appointment history.
              </p>
            </div>

            <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search patient"
                className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>

            {loadingPatients ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-20 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-semibold text-slate-500">
                No patients found.
              </div>
            ) : (
              <div className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">
                {filteredPatients.map((patient) => {
                  const isSelected = patient.id === selectedPatientId;
                  return (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-teal-200 bg-teal-50 text-teal-900 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-xl p-2 ${isSelected ? 'bg-white text-teal-600' : 'bg-slate-100 text-slate-500'}`}
                        >
                          <UserRound className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-extrabold">
                            {getPatientName(patient)}
                          </p>
                          <p className="truncate text-xs font-medium text-slate-500">
                            {patient.email}
                          </p>
                          <p className="mt-2 text-xs font-bold text-slate-500">
                            Last visit: {formatDate(patient.latestVisit?.date)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <main className="space-y-6 lg:col-span-8 xl:col-span-9">
          {!selectedPatient ? (
            <div className="flex min-h-[28rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <FileLock2 className="mb-4 h-12 w-12 text-slate-300" />
              <h2 className="text-xl font-extrabold text-slate-900">
                Select a patient to begin
              </h2>
              <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
                Once selected, you can add private notes and review the secure
                timeline.
              </p>
            </div>
          ) : (
            <>
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">
                      {getPatientName(selectedPatient)}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {selectedPatient.email}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600 sm:grid-cols-4">
                    <span className="rounded-xl bg-slate-50 px-3 py-2">
                      Blood:{' '}
                      {selectedPatient.patientProfile?.bloodGroup || 'N/A'}
                    </span>
                    <span className="rounded-xl bg-slate-50 px-3 py-2">
                      Gender: {selectedPatient.patientProfile?.gender || 'N/A'}
                    </span>
                    <span className="rounded-xl bg-slate-50 px-3 py-2">
                      Visits: {visits.length}
                    </span>
                    <span className="rounded-xl bg-slate-50 px-3 py-2">
                      Notes: {pagination.total || 0}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSaveNote} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Visit Context
                    </label>
                    <select
                      value={appointmentId}
                      onChange={(event) => setAppointmentId(event.target.value)}
                      disabled={loadingVisits}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-colors hover:border-teal-300 focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">General patient note</option>
                      {visits.map((visit) => (
                        <option key={visit.id} value={visit.id}>
                          {formatDate(visit.date)} at {visit.startTime} -{' '}
                          {visit.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Private Note
                    </label>
                    <textarea
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      placeholder="Internal observations, differential diagnosis, follow-up concerns..."
                      className="min-h-36 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition-colors placeholder:text-slate-400 hover:border-teal-300 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isSaving ? 'Saving...' : 'Save Private Note'}
                    </button>
                  </div>
                </form>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Private Timeline
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Newest notes appear first.
                    </p>
                  </div>
                </div>

                {loadingNotes ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="h-28 animate-pulse rounded-2xl bg-slate-100"
                      />
                    ))}
                  </div>
                ) : notes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">
                    No private notes yet for this patient.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => {
                      const isEditing = editingNoteId === note.id;
                      return (
                        <article
                          key={note.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                              <Calendar className="h-4 w-4 text-teal-600" />
                              {formatDateTime(note.createdAt)}
                              {note.appointment && (
                                <span className="rounded-full bg-white px-3 py-1 text-xs text-teal-700">
                                  Visit {formatDate(note.appointment.date)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateNote(note.id)}
                                    className="rounded-lg bg-teal-600 p-2 text-white hover:bg-teal-700"
                                    aria-label="Save note"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditing}
                                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100"
                                    aria-label="Cancel editing"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEditing(note)}
                                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100"
                                    aria-label="Edit note"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setNoteToDelete(note)}
                                    className="rounded-lg border border-rose-200 bg-white p-2 text-rose-600 hover:bg-rose-50"
                                    aria-label="Delete note"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {isEditing ? (
                            <textarea
                              value={editingContent}
                              onChange={(event) =>
                                setEditingContent(event.target.value)
                              }
                              className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          ) : (
                            <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700">
                              {note.content}
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}

                {pagination.totalPages > 1 && (
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        setPage((current) => Math.max(current - 1, 1))
                      }
                      disabled={page <= 1}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-bold text-slate-500">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPage((current) =>
                          Math.min(current + 1, pagination.totalPages)
                        )
                      }
                      disabled={page >= pagination.totalPages}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40">
                <MedicalDocuments
                  patientId={selectedPatientId}
                  readOnly
                  compact
                  title="Patient Documents"
                  subtitle="Read-only medical files uploaded by this patient for consultation review."
                />
              </section>
            </>
          )}
        </main>
      </div>

      <ConfirmationModal
        isOpen={Boolean(noteToDelete)}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleDeleteNote}
        isLoading={isDeleting}
        type="danger"
        title="Delete Private Note?"
        message="This removes the note from the confidential doctor-only timeline."
        confirmText="Delete Note"
      />
    </div>
  );
};

export default PrivateDoctorNotes;
