import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  Download,
  Eye,
  FileText,
  Filter,
  FolderOpen,
  Pill,
  Search,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import api, { fetcher } from '../utils/api';

const statusFilters = [
  { value: 'ALL', label: 'All Visits' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'RESCHEDULED', label: 'Rescheduled' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const formatDate = (dateString) => {
  if (!dateString) return 'No date';
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getPatientName = (patient) => {
  if (!patient) return 'Unknown patient';
  return (
    `${patient.firstName || ''} ${patient.lastName || ''}`.trim() ||
    patient.email
  );
};

const getFileName = (fileUrl) => {
  const parts = String(fileUrl || '').split('/');
  return parts[parts.length - 1] || 'document';
};

const PatientMedicalHistory = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('ALL');

  const {
    data: patients = [],
    isLoading: loadingPatients,
    error: patientsError,
  } = useSWR('/history/patients', fetcher);

  const historyUrl = patientId
    ? `/history/${patientId}?page=${page}&limit=8&status=${status}`
    : null;

  const {
    data: history,
    isLoading: loadingHistory,
    error: historyError,
  } = useSWR(historyUrl, fetcher);

  const filteredPatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return patients;

    return patients.filter((patient) => {
      const searchable =
        `${patient.firstName || ''} ${patient.lastName || ''} ${patient.email || ''}`.toLowerCase();
      return searchable.includes(query);
    });
  }, [patients, searchTerm]);

  const selectPatient = (id) => {
    setPage(1);
    setStatus('ALL');
    navigate(`/dashboard/patient-medical-history/${id}`);
  };

  const openAttachment = async (attachment, download = false) => {
    try {
      const response = await api.get(
        `${attachment.fileUrl}${download ? '?download=true' : ''}`,
        {
          responseType: 'blob',
        }
      );
      const blobUrl = URL.createObjectURL(response.data);

      if (download) {
        const link = window.document.createElement('a');
        link.href = blobUrl;
        link.download = getFileName(attachment.fileUrl);
        link.click();
        URL.revokeObjectURL(blobUrl);
        return;
      }

      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not open attachment.');
    }
  };

  const records = history?.records || [];
  const pagination = history?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 font-sans">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-700">
            <Stethoscope className="h-4 w-4" />
            Doctor-only medical timeline
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Patient Medical History
          </h1>
          <p className="mt-2 max-w-3xl text-base font-medium text-slate-500">
            Review complete visit history, prescription snapshots, and same-day
            attachments from latest to oldest.
          </p>
        </div>
        {history?.patient && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm">
            {pagination.total} visit record{pagination.total === 1 ? '' : 's'}
          </div>
        )}
      </div>

      {(patientsError || historyError) && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          Failed to load medical history data.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-4 xl:col-span-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/40">
            <div className="mb-4">
              <h2 className="text-lg font-extrabold text-slate-900">
                Select Patient
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Choose a patient to open the timeline.
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
              <div className="max-h-[36rem] space-y-2 overflow-y-auto pr-1">
                {filteredPatients.map((patient) => {
                  const isSelected = patient.id === patientId;
                  return (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => selectPatient(patient.id)}
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
                            Last visit:{' '}
                            {patient.latestVisit
                              ? formatDate(patient.latestVisit.date)
                              : 'No visits'}
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

        <main className="lg:col-span-8 xl:col-span-9">
          {!patientId ? (
            <div className="flex min-h-[30rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <CalendarDays className="mb-4 h-12 w-12 text-slate-300" />
              <h2 className="text-xl font-extrabold text-slate-900">
                Select a patient
              </h2>
              <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
                The complete doctor-only medical timeline will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">
                      {history?.patient?.name || 'Loading patient...'}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {history?.patient?.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <select
                      value={status}
                      onChange={(event) => {
                        setPage(1);
                        setStatus(event.target.value);
                      }}
                      className="bg-transparent text-sm font-bold text-slate-700 outline-none"
                    >
                      {statusFilters.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {loadingHistory ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-48 animate-pulse rounded-3xl bg-slate-100"
                    />
                  ))}
                </div>
              ) : records.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                  <h2 className="text-xl font-extrabold text-slate-900">
                    No visit records found
                  </h2>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Try a different status filter or select another patient.
                  </p>
                </div>
              ) : (
                <section className="relative space-y-5">
                  <div className="absolute left-5 top-2 hidden h-full w-px bg-slate-200 md:block" />

                  {records.map((record) => (
                    <article key={record.id} className="relative md:pl-14">
                      <div className="absolute left-0 top-6 hidden h-10 w-10 items-center justify-center rounded-full border border-teal-100 bg-teal-50 text-teal-600 md:flex">
                        <CalendarDays className="h-5 w-5" />
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-extrabold uppercase tracking-wide text-teal-700">
                              {formatDate(record.visitDate)} at{' '}
                              {record.startTime}
                            </p>
                            <h3 className="mt-1 text-xl font-extrabold text-slate-900">
                              {record.doctorName}
                            </h3>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                              {record.doctorSpecialization ||
                                'General consultation'}{' '}
                              - {record.type.replace('_', ' ')}
                            </p>
                          </div>
                          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600">
                            {record.status}
                          </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <h4 className="mb-2 text-sm font-extrabold text-slate-900">
                              Diagnosis
                            </h4>
                            <p className="text-sm font-medium leading-relaxed text-slate-600">
                              {record.diagnosis || 'No diagnosis recorded.'}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <h4 className="mb-2 text-sm font-extrabold text-slate-900">
                              Prescription Summary
                            </h4>
                            <p className="text-sm font-medium leading-relaxed text-slate-600">
                              {record.prescriptionSummary ||
                                'No prescription recorded.'}
                            </p>
                          </div>
                        </div>

                        {record.prescriptions.length > 0 && (
                          <div className="mt-4 rounded-2xl border border-slate-100 p-4">
                            <h4 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                              <Pill className="h-4 w-4 text-teal-600" />
                              Medications
                            </h4>
                            <div className="grid gap-2 md:grid-cols-2">
                              {record.prescriptions.map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-xl bg-slate-50 p-3 text-sm"
                                >
                                  <p className="font-extrabold text-slate-900">
                                    {item.medicineName}
                                  </p>
                                  <p className="mt-1 font-medium text-slate-500">
                                    {item.dosage} - {item.frequency} -{' '}
                                    {item.duration}
                                  </p>
                                  {item.instructions && (
                                    <p className="mt-1 text-xs font-medium text-slate-500">
                                      {item.instructions}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 rounded-2xl border border-slate-100 p-4">
                          <h4 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                            <FolderOpen className="h-4 w-4 text-teal-600" />
                            Related Attachments
                          </h4>
                          {record.attachments.length === 0 ? (
                            <p className="text-sm font-medium text-slate-500">
                              No same-day attachments found.
                            </p>
                          ) : (
                            <div className="grid gap-2 md:grid-cols-2">
                              {record.attachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-extrabold text-slate-900">
                                      {attachment.title}
                                    </p>
                                    <p className="text-xs font-bold text-slate-500">
                                      {attachment.documentType}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openAttachment(attachment)}
                                      className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                                      aria-label="Preview attachment"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openAttachment(attachment, true)
                                      }
                                      className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                                      aria-label="Download attachment"
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </section>
              )}

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PatientMedicalHistory;
