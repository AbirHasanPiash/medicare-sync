import { useState } from 'react';
import useSWR from 'swr';
import api, { fetcher } from '../utils/api';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import { 
  Calendar, Clock, User, CheckCircle, 
  XCircle, FileText, MapPin, Video 
} from 'lucide-react';

// Skeleton Component
const ScheduleSkeleton = () => (
  <div className="flex flex-col md:flex-row bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-pulse">
    {/* Left Date Panel */}
    <div className="md:w-64 p-5 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center gap-3">
      <div className="w-1/2 h-4 bg-slate-200 rounded"></div>
      <div className="w-3/4 h-6 bg-slate-300 rounded"></div>
    </div>

    {/* Middle Info Panel */}
    <div className="flex-1 p-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0"></div>
        <div className="space-y-2 w-full">
          <div className="w-1/3 h-5 bg-slate-300 rounded"></div>
          <div className="w-1/4 h-4 bg-slate-200 rounded"></div>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-1/2 h-16 bg-slate-50 border border-slate-100 rounded-xl"></div>
        <div className="w-1/2 h-16 bg-slate-50 border border-slate-100 rounded-xl"></div>
      </div>
    </div>

    {/* Right Action Panel */}
    <div className="md:w-40 p-5 border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50 flex flex-col justify-center gap-2">
      <div className="w-full h-10 bg-slate-200 rounded-xl"></div>
      <div className="w-full h-10 bg-slate-200 rounded-xl"></div>
    </div>
  </div>
);

const DoctorSchedule = () => {
  const [updatingId, setUpdatingId] = useState(null);
  
  // Modal State for Cancelling
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [apptToCancel, setApptToCancel] = useState(null);

  const { data: appointments, error, isLoading, mutate } = useSWR(
    '/appointments/my-appointments',
    fetcher
  );

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    if (!appointments) return;
    setUpdatingId(appointmentId);

    try {
      // Optimistic UI Update
      const optimisticData = appointments.map((app) =>
        app.id === appointmentId ? { ...app, status: newStatus } : app
      );
      mutate(optimisticData, false);

      // API Call
      await api.put(`/appointments/${appointmentId}`, {
        status: newStatus,
      });

      mutate();

      // Trigger beautiful success toasts based on the action
      if (newStatus === 'COMPLETED') {
        toast.success('Appointment marked as completed!');
      } else if (newStatus === 'CANCELLED') {
        toast.success('Appointment cancelled successfully.');
      }

    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update status.');
      mutate(); // Rollback on failure
    } finally {
      setUpdatingId(null);
    }
  };

  // Open the cancellation confirmation modal
  const openCancelModal = (id) => {
    setApptToCancel(id);
    setCancelModalOpen(true);
  };

  // Execute cancellation if confirmed
  const executeCancel = async () => {
    if (!apptToCancel) return;
    await handleStatusUpdate(apptToCancel, 'CANCELLED');
    setCancelModalOpen(false);
    setApptToCancel(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return <span className="px-3 py-1 text-xs font-bold text-blue-700 bg-blue-100 rounded-full">Upcoming</span>;
      case 'COMPLETED':
        return <span className="px-3 py-1 text-xs font-bold text-teal-700 bg-teal-100 rounded-full">Completed</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 text-xs font-bold text-red-700 bg-red-100 rounded-full">Cancelled</span>;
      case 'RESCHEDULED':
        return <span className="px-3 py-1 text-xs font-bold text-orange-700 bg-orange-100 rounded-full">Rescheduled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto font-sans relative">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            My Schedule
          </h1>
          <p className="mt-2 text-slate-500 text-lg">
            Manage your daily patient queue and appointments.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 mb-6 text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-xl">
          Failed to load schedule. Please check your connection.
        </div>
      )}

      {/* Content */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <ScheduleSkeleton />
            <ScheduleSkeleton />
            <ScheduleSkeleton />
          </>
        ) : !appointments || appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white border border-dashed rounded-3xl border-slate-300 h-80">
            <Calendar className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-700">
              No appointments yet
            </h3>
            <p className="text-slate-500 mt-2 max-w-sm">
              Your schedule is completely clear. When patients book an appointment,
              they will appear here.
            </p>
          </div>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className={`group flex flex-col md:flex-row bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-teal-200 ${
                appointment.status === 'CANCELLED'
                  ? 'opacity-60 grayscale-[30%]'
                  : ''
              }`}
            >

              {/* Left Panel: Date & Time */}
              <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center p-5 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 md:w-64 gap-2 group-hover:bg-teal-50/30 transition-colors">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold">
                    {formatDate(appointment.date)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-800">
                  <Clock className="w-5 h-5 text-teal-600" />
                  <span className="text-lg font-bold tracking-tight">
                    {appointment.startTime} - {appointment.endTime}
                  </span>
                </div>
              </div>

              {/* Middle Panel: Patient Details & Context */}
              <div className="flex-1 p-5">
                
                {/* Top Row: Patient Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 flex items-center justify-center bg-teal-50 rounded-full text-teal-600">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        {appointment.patient?.firstName}{' '}
                        {appointment.patient?.lastName}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium">
                        {appointment.patient?.email}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>

                {/* Bottom Row: Context Cards (Location & Reason) */}
                <div className="flex flex-col sm:flex-row gap-3">
                  
                  {/* Location Card */}
                  <div className="flex-1 flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                    {appointment.type === 'TELEHEALTH' ? (
                      <Video className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    ) : (
                      <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-slate-800">
                        {appointment.type === 'TELEHEALTH' ? 'Online Video Call' : 'In-Person Visit'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">
                        {appointment.location || 'Location not specified'}
                      </p>
                    </div>
                  </div>

                  {/* Reason Card (Only renders if a reason was provided) */}
                  {appointment.reason && (
                    <div className="flex-1 flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800">Reason</p>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">
                          {appointment.reason}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Right Panel: Actions */}
              {appointment.status === 'SCHEDULED' && (
                <div className="flex flex-row md:flex-col items-center justify-center gap-3 p-5 border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50/50 md:w-40 shrink-0">
                  <button
                    onClick={() => handleStatusUpdate(appointment.id, 'COMPLETED')}
                    disabled={updatingId === appointment.id}
                    className="flex-1 md:flex-none w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-teal-700 bg-teal-100 rounded-xl hover:bg-teal-600 hover:text-white transition-all duration-200 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete
                  </button>

                  <button
                    onClick={() => openCancelModal(appointment.id)}
                    disabled={updatingId === appointment.id}
                    className="flex-1 md:flex-none w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-200 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      <ConfirmationModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={executeCancel}
        isLoading={updatingId === apptToCancel}
        type="danger"
        title="Cancel Appointment?"
        message="Are you sure you want to cancel this patient's appointment? They will be notified and this slot will be opened up for other patients."
        confirmText="Yes, Cancel It"
      />

    </div>
  );
};

export default DoctorSchedule;