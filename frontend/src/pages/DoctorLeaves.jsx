import { useState } from 'react';
import useSWR from 'swr';
import api, { fetcher } from '../utils/api';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import { CalendarOff, Trash2, Plus, Calendar, AlertCircle, Loader2 } from 'lucide-react';

// Skeleton Component
const LeaveSkeleton = () => (
  <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm animate-pulse">
    <div className="space-y-2 w-full">
      <div className="h-5 bg-slate-200 rounded w-1/3"></div>
      <div className="h-4 bg-slate-100 rounded w-1/2"></div>
    </div>
    <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0 ml-4"></div>
  </div>
);

const DoctorLeaves = () => {
  // Form State
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Data Fetching
  const {
    data,
    error: fetchError,
    isLoading,
    mutate,
  } = useSWR('/appointments/blocks', fetcher);

  // Filter out past leaves
  const upcomingLeaves = data
    ? data.filter((d) => new Date(d.date) >= new Date(today))
    : [];

  const handleAddLeave = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/appointments/blocks', { date, reason });

      toast.success('Date blocked successfully!');
      setDate('');
      setReason('');

      // Tell SWR to instantly re-fetch
      mutate();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to block date.');
    } finally {
      setSubmitting(false);
    }
  };

  // Opens the confirmation modal
  const confirmDelete = (id) => {
    setLeaveToDelete(id);
    setDeleteModalOpen(true);
  };

  // Executes the actual deletion when confirmed
  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      // Optimistically update the UI to make it feel instant
      mutate(
        data.filter((b) => b.id !== leaveToDelete),
        false
      );

      await api.delete(`/appointments/blocks/${leaveToDelete}`);

      // Re-validate with the server to ensure consistency
      mutate();
      toast.success('Leave cancelled successfully');
      setDeleteModalOpen(false);
    } catch (err) {
      toast.error('Failed to delete leave. Please check your connection.');
      mutate(); // Rollback if it fails
    } finally {
      setIsDeleting(false);
      setLeaveToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto font-sans relative">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Leave Management
        </h1>
        <p className="mt-2 text-slate-500 text-lg">
          Block off dates for holidays or emergencies to prevent patient
          bookings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form to Add Leave (Sticky on Desktop) */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 transition-all duration-500">
          <div className="p-6 md:p-8 bg-white border border-slate-200 rounded-3xl shadow-lg shadow-slate-200/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
              <CalendarOff className="w-5 h-5 text-teal-600" />
              Schedule Time Off
            </h2>

            <form onSubmit={handleAddLeave}>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-bold text-slate-700">
                  Select Date
                </label>
                <input
                  type="date"
                  min={today}
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors text-slate-800 font-medium hover:border-teal-300 cursor-pointer"
                />
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-bold text-slate-700">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Medical Conference, Vacation"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors text-slate-800 hover:border-teal-300"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !date}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 font-bold text-white transition-all shadow-md bg-teal-600 rounded-xl hover:bg-teal-700 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 text-lg"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                {submitting ? 'Blocking...' : 'Block Date'}
              </button>
            </form>

            <div className="mt-6 flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                Blocking a date immediately removes your availability from the
                Patient Booking Portal for that entire day.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Leaves List */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-slate-500" />
            Upcoming Blocked Dates
          </h2>

          {fetchError && (
            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
              Failed to load schedule.
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <LeaveSkeleton key={i} />
              ))}
            </div>
          ) : upcomingLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed rounded-3xl border-slate-300 h-64">
              <CalendarOff className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium text-lg">
                You have no upcoming time off scheduled.
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Use the panel on the left to block dates.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {upcomingLeaves.map((block) => (
                <div
                  key={block.id}
                  className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-md hover:border-teal-200 transition-all duration-200"
                >
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">
                      {formatDate(block.date)}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                      {block.reason || 'No reason provided'}
                    </p>
                  </div>
                  <button
                    onClick={() => confirmDelete(block.id)}
                    className="p-3 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                    title="Remove Block"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal instance */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executeDelete}
        isLoading={isDeleting}
        type="danger"
        title="Cancel Time Off?"
        message="Are you sure you want to cancel this leave? This will immediately open up the day for patient bookings again."
        confirmText="Yes, Cancel Leave"
      />
    </div>
  );
};

export default DoctorLeaves;
