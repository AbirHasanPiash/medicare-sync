import { useMemo, useState } from 'react';
import { Download, Plus, Trash2, Pill } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import {
  getAppointmentOptions,
  buildPdfPayloadFromSavedPrescription,
  savePrescription,
  downloadPrescriptionPdf,
} from '../controllers/digitalPrescriptionController.jsx';

const emptyMedication = {
  medicineName: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
};

const DoctorPrescriptionSection = ({ allAppointments, isLoading }) => {
  const [form, setForm] = useState({
    appointmentId: '',
    diagnosis: '',
    symptoms: '',
    treatmentPlan: '',
    clinicalNotes: '',
    medications: [{ ...emptyMedication }],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedPrescription, setSavedPrescription] = useState(null);

  const appointmentOptions = useMemo(() => {
    return getAppointmentOptions(allAppointments, true);
  }, [allAppointments]);

  const selectedAppointment = useMemo(() => {
    return (
      appointmentOptions.find((item) => item.id === form.appointmentId) || null
    );
  }, [appointmentOptions, form.appointmentId]);

  const updateMedicationField = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      medications: prev.medications.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addMedicationRow = () => {
    setForm((prev) => ({
      ...prev,
      medications: [...prev.medications, { ...emptyMedication }],
    }));
  };

  const removeMedicationRow = (index) => {
    setForm((prev) => ({
      ...prev,
      medications: prev.medications.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const handleSavePrescription = async (event) => {
    event.preventDefault();

    if (!form.appointmentId) {
      toast.error('Please select an appointment first.');
      return;
    }

    setIsSaving(true);
    try {
      const medicalRecord = await savePrescription({ api, form });
      setSavedPrescription(medicalRecord);
      toast.success('Digital prescription saved.');
    } catch (saveError) {
      toast.error(
        saveError.response?.data?.error || 'Failed to save prescription.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const buildPdfPayload = () => {
    return buildPdfPayloadFromSavedPrescription({
      savedPrescription,
      selectedAppointment,
    });
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadPrescriptionPdf({
        payload: buildPdfPayload(),
        appointmentId: form.appointmentId,
      });
      toast.success('Prescription PDF downloaded.');
    } catch (downloadError) {
      toast.error(downloadError.message || 'Could not generate PDF.');
    }
  };

  return (
    <form
      onSubmit={handleSavePrescription}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
    >
      <section className="lg:col-span-8 p-6 md:p-8 bg-white border border-slate-200 rounded-3xl shadow-lg shadow-slate-200/40 space-y-5">
        <div>
          <label className="block mb-2 text-sm font-bold text-slate-700">
            Appointment
          </label>
          <select
            value={form.appointmentId}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                appointmentId: event.target.value,
              }))
            }
            disabled={isLoading}
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 font-medium hover:border-teal-300 cursor-pointer"
          >
            <option value="">Select booked/completed visit</option>
            {appointmentOptions.map((appointment) => (
              <option key={appointment.id} value={appointment.id}>
                {new Date(appointment.date).toLocaleDateString()} -{' '}
                {appointment.patient?.firstName} {appointment.patient?.lastName}{' '}
                ({appointment.status})
              </option>
            ))}
          </select>
          {!isLoading && appointmentOptions.length === 0 && (
            <p className="mt-2 text-sm text-amber-600">
              No active booked visits found yet.
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-2 text-sm font-bold text-slate-700">
              Diagnosis
            </label>
            <input
              value={form.diagnosis}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, diagnosis: event.target.value }))
              }
              placeholder="e.g. Acute pharyngitis"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 hover:border-teal-300"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-bold text-slate-700">
              Symptoms (comma separated)
            </label>
            <input
              value={form.symptoms}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, symptoms: event.target.value }))
              }
              placeholder="Fever, sore throat"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 hover:border-teal-300"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-2 text-sm font-bold text-slate-700">
              Treatment Plan
            </label>
            <textarea
              value={form.treatmentPlan}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  treatmentPlan: event.target.value,
                }))
              }
              placeholder="Advise rest and hydration"
              className="h-24 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 hover:border-teal-300"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-bold text-slate-700">
              Clinical Notes
            </label>
            <textarea
              value={form.clinicalNotes}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  clinicalNotes: event.target.value,
                }))
              }
              placeholder="Follow-up in 7 days"
              className="h-24 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 hover:border-teal-300"
            />
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <Pill className="w-5 h-5 text-teal-600" />
              Medications
            </h2>
            <button
              type="button"
              onClick={addMedicationRow}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-3 py-2 text-sm font-bold text-white hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Medication
            </button>
          </div>

          {form.medications.map((medication, index) => (
            <div
              key={`med-${index}`}
              className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-5"
            >
              <input
                value={medication.medicineName}
                onChange={(event) =>
                  updateMedicationField(
                    index,
                    'medicineName',
                    event.target.value
                  )
                }
                placeholder="Medicine"
                required
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                value={medication.dosage}
                onChange={(event) =>
                  updateMedicationField(index, 'dosage', event.target.value)
                }
                placeholder="Dosage"
                required
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                value={medication.frequency}
                onChange={(event) =>
                  updateMedicationField(index, 'frequency', event.target.value)
                }
                placeholder="Frequency"
                required
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                value={medication.duration}
                onChange={(event) =>
                  updateMedicationField(index, 'duration', event.target.value)
                }
                placeholder="Duration"
                required
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <div className="flex items-center gap-2">
                <input
                  value={medication.instructions}
                  onChange={(event) =>
                    updateMedicationField(
                      index,
                      'instructions',
                      event.target.value
                    )
                  }
                  placeholder="Instructions"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {form.medications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedicationRow(index)}
                    className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="lg:col-span-4 lg:sticky lg:top-24">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40">
          <h3 className="text-lg font-extrabold text-slate-900">Actions</h3>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-xl bg-teal-600 px-4 py-3 font-bold text-white hover:bg-teal-700 transition-colors disabled:opacity-60"
          >
            {isSaving ? 'Saving Prescription...' : 'Save Prescription'}
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>

          {selectedAppointment ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-bold text-slate-800">Selected Visit</p>
              <p className="mt-1 text-slate-800 font-medium">
                {selectedAppointment.patient?.firstName}{' '}
                {selectedAppointment.patient?.lastName}
              </p>
              <p>{new Date(selectedAppointment.date).toLocaleDateString()}</p>
              <div className="mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold bg-blue-100 text-blue-700">
                {selectedAppointment.status}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Select an appointment to preview visit details.
            </div>
          )}

          <div className="rounded-xl border border-teal-100 bg-teal-50 p-4 text-xs font-medium leading-relaxed text-teal-800">
            Tip: Save first, then use Download PDF.
          </div>
        </div>
      </aside>
    </form>
  );
};

export default DoctorPrescriptionSection;
