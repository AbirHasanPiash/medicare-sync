import { useMemo } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import {
  formatPrescriptionDate,
  getAppointmentsWithPrescriptions,
  downloadPatientPrescriptionPdf,
} from '../controllers/digitalPrescriptionController.jsx';

const PatientPrescriptionSection = ({ allAppointments, isLoading }) => {
  const appointmentsWithPrescriptions = useMemo(() => {
    return getAppointmentsWithPrescriptions(allAppointments);
  }, [allAppointments]);

  const handleDownloadPdf = async (appointmentId) => {
    try {
      await downloadPatientPrescriptionPdf({ api, appointmentId });
      toast.success('Prescription PDF downloaded.');
    } catch (downloadError) {
      toast.error(
        downloadError.response?.data?.error || 'Could not download PDF.'
      );
    }
  };

  return (
    <section className="space-y-4">
      {isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
          Loading your prescriptions...
        </div>
      )}

      {!isLoading && appointmentsWithPrescriptions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
          No prescriptions found yet. Your doctor will add prescriptions after
          consultations.
        </div>
      )}

      {appointmentsWithPrescriptions.map((appointment) => {
        return (
          <article
            key={appointment.id}
            className="overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-b from-amber-50/40 via-white to-white shadow-lg shadow-slate-200/40"
          >
            <div className="border-b border-amber-200 bg-gradient-to-r from-teal-700 to-teal-600 px-6 py-5 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-100">
                    MediCare Sync
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
                    Digital Prescription
                  </h2>
                  <p className="mt-1 text-sm font-medium text-teal-100">
                    Issued by Dr. {appointment.doctor?.firstName}{' '}
                    {appointment.doctor?.lastName}
                  </p>
                </div>
                <div className="rounded-xl border border-teal-400/60 bg-teal-800/40 px-4 py-3 text-sm">
                  <p className="font-bold">Visit Date</p>
                  <p className="mt-1 font-medium text-teal-50">
                    {formatPrescriptionDate(appointment.date)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-12">
              <div className="lg:col-span-8 space-y-5">
                <div className="grid gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-900/70">
                      Patient Name
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {appointment.patient?.firstName}{' '}
                      {appointment.patient?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-900/70">
                      Status
                    </p>
                    <p className="mt-1 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                      {appointment.status}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-900/70">
                      Patient Email
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {appointment.patient?.email || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-lg font-bold text-slate-900">Rx</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Diagnosis
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {appointment.medicalRecord?.diagnosis || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Symptoms
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {Array.isArray(appointment.medicalRecord?.symptoms)
                          ? appointment.medicalRecord.symptoms.join(', ')
                          : appointment.medicalRecord?.symptoms || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
                    Medication Chart
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                      <thead>
                        <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                          <th className="px-3">Medicine</th>
                          <th className="px-3">Dose</th>
                          <th className="px-3">Schedule</th>
                          <th className="px-3">Duration</th>
                          <th className="px-3">Instructions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(appointment.medicalRecord?.prescriptions || []).map(
                          (item) => (
                            <tr
                              key={item.id}
                              className="rounded-lg bg-slate-50 text-slate-700"
                            >
                              <td className="px-3 py-2 font-semibold text-slate-900">
                                {item.medicineName}
                              </td>
                              <td className="px-3 py-2">{item.dosage}</td>
                              <td className="px-3 py-2">{item.frequency}</td>
                              <td className="px-3 py-2">{item.duration}</td>
                              <td className="px-3 py-2">
                                {item.instructions || 'With water after meals'}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <aside className="lg:col-span-4 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Treatment Plan
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    {appointment.medicalRecord?.treatmentPlan ||
                      'Follow the medication chart and monitor symptoms.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Doctor Notes
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    {appointment.medicalRecord?.clinicalNotes ||
                      'Attend follow-up as advised by your doctor.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Doctor Signature
                  </p>
                  <div className="mt-6 border-t border-dashed border-slate-300 pt-2">
                    <p className="text-sm font-semibold text-slate-800">
                      Dr. {appointment.doctor?.firstName}{' '}
                      {appointment.doctor?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      Electronically signed via MediCare Sync EMR
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadPdf(appointment.id)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </button>
              </aside>
            </div>

            <div className="border-t border-amber-200 bg-amber-50/70 px-6 py-3 text-xs font-medium text-amber-900/70">
              Keep this prescription for pharmacy visits and future
              consultations.
            </div>
          </article>
        );
      })}
    </section>
  );
};

export default PatientPrescriptionSection;
