import { useContext } from 'react';
import useSWR from 'swr';
import { FileText } from 'lucide-react';
import { fetcher } from '../utils/api';
import { AuthContext } from '../contexts/AuthContext';
import DoctorPrescriptionSection from './DoctorPrescriptionSection';
import PatientPrescriptionSection from './PatientPrescriptionSection';

const DigitalPrescriptions = () => {
  const { user } = useContext(AuthContext);
  const isDoctor = user?.role === 'DOCTOR';
  const isPatient = user?.role === 'PATIENT';

  const {
    data: allAppointments,
    error,
    isLoading,
  } = useSWR('/appointments/my-appointments', fetcher);

  return (
    <div className="max-w-6xl mx-auto font-sans relative">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-extrabold text-slate-900 tracking-tight">
          <FileText className="w-6 h-6 text-teal-600" />
          Digital Prescriptions (EMR)
        </h1>
        <p className="mt-2 text-slate-500 text-lg">
          {isDoctor
            ? 'Create and save digital prescriptions for booked or completed visits, then download a PDF.'
            : 'View prescriptions created by your doctor and download PDF copies.'}
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-xl">
          Failed to load appointments.
        </div>
      )}

      {isDoctor ? (
        <DoctorPrescriptionSection
          allAppointments={allAppointments}
          isLoading={isLoading}
        />
      ) : isPatient ? (
        <PatientPrescriptionSection
          allAppointments={allAppointments}
          isLoading={isLoading}
        />
      ) : (
        <section className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-medium text-amber-800">
            Prescriptions are available only for doctor and patient roles.
          </div>
        </section>
      )}
    </div>
  );
};

export default DigitalPrescriptions;
