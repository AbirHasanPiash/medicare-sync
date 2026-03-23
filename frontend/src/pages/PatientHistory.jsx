import { useState, useEffect } from 'react';
import useSWR from 'swr';
import api, { fetcher } from '../utils/api';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import { 
  Calendar, Clock, XCircle, RefreshCw, FileText, 
  CheckCircle2, X, Loader2, MapPin, Video 
} from 'lucide-react';

// Skeleton Component
const HistorySkeleton = () => (
  <div className="flex flex-col md:flex-row bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-pulse mb-4">
    <div className="md:w-56 p-5 bg-teal-50/50 border-b md:border-b-0 md:border-r border-teal-100 flex flex-col justify-center gap-3">
      <div className="w-3/4 h-4 bg-teal-200/60 rounded"></div>
      <div className="w-1/2 h-6 bg-teal-300/60 rounded"></div>
    </div>
    <div className="flex-1 p-5">
      <div className="space-y-2 w-full mb-4">
        <div className="w-1/3 h-5 bg-slate-200 rounded"></div>
        <div className="w-1/4 h-4 bg-slate-100 rounded"></div>
      </div>
      <div className="w-1/2 h-12 bg-slate-50 border border-slate-100 rounded-xl"></div>
    </div>
    <div className="flex flex-row md:flex-col p-4 border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50 gap-2 justify-center">
      <div className="w-full h-10 bg-slate-200 rounded-xl md:w-32"></div>
      <div className="w-full h-10 bg-slate-200 rounded-xl md:w-32"></div>
    </div>
  </div>
);

const PatientHistory = () => {
  // Modal States
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [apptToCancel, setApptToCancel] = useState(null);
  const [isCanceling, setIsCanceling] = useState(false);

  // Reschedule States
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [selectedNewSlot, setSelectedNewSlot] = useState(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Fetch Patient History
  const { 
    data: appointments, 
    error: fetchError, 
    isLoading, 
    mutate 
  } = useSWR('/appointments/my-appointments', fetcher);

  // Conditional Fetching for Slots (Only runs if a new date is picked in the modal)
  const { 
    data: slotsData, 
    isLoading: loadingSlots 
  } = useSWR(
    newDate && selectedAppt 
      ? `/appointments/slots?doctorId=${selectedAppt.doctorId}&date=${newDate}` 
      : null, 
    fetcher
  );

  const availableSlots = slotsData?.slots || [];

  // Reset selected slot if the user changes the date in the modal
  useEffect(() => {
    setSelectedNewSlot(null);
  }, [newDate]);

  // Cancel Logic
  const openCancelModal = (id) => {
    setApptToCancel(id);
    setCancelModalOpen(true);
  };

  const executeCancel = async () => {
    setIsCanceling(true);
    try {
      mutate(appointments.map(app => app.id === apptToCancel ? { ...app, status: 'CANCELLED' } : app), false);
      await api.put(`/appointments/${apptToCancel}`, { status: 'CANCELLED' });
      mutate();
      toast.success('Appointment cancelled successfully.');
      setCancelModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel appointment.');
      mutate(); 
    } finally {
      setIsCanceling(false);
      setApptToCancel(null);
    }
  };

  // Reschedule Logic
  const openRescheduleModal = (app) => {
    setSelectedAppt(app);
    setNewDate('');
    setSelectedNewSlot(null);
    setIsRescheduleOpen(true);
  };

  const submitReschedule = async () => {
    if (!selectedNewSlot || !newDate) return toast.error('Please select a date and time slot.');
    setIsRescheduling(true);

    try {
      await api.put(`/appointments/${selectedAppt.id}`, {
        status: 'RESCHEDULED',
        date: newDate,
        startTime: selectedNewSlot.startTime,
        endTime: selectedNewSlot.endTime,
        type: selectedNewSlot.type,
        location: selectedNewSlot.location
      });

      mutate(); 
      toast.success('Appointment rescheduled successfully!');
      setIsRescheduleOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reschedule.');
    } finally {
      setIsRescheduling(false);
    }
  };

  // Helpers
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SCHEDULED': return <span className="px-3 py-1 text-xs font-bold text-blue-700 bg-blue-100 rounded-full">Upcoming</span>;
      case 'COMPLETED': return <span className="px-3 py-1 text-xs font-bold text-teal-700 bg-teal-100 rounded-full">Completed</span>;
      case 'CANCELLED': return <span className="px-3 py-1 text-xs font-bold text-red-700 bg-red-100 rounded-full">Cancelled</span>;
      case 'RESCHEDULED': return <span className="px-3 py-1 text-xs font-bold text-orange-700 bg-orange-100 rounded-full">Rescheduled</span>;
      default: return null;
    }
  };

  // Separate appointments
  const upcomingApps = appointments?.filter(a => ['SCHEDULED', 'RESCHEDULED'].includes(a.status)) || [];
  const pastApps = appointments?.filter(a => ['COMPLETED', 'CANCELLED'].includes(a.status)) || [];

  return (
    <div className="max-w-5xl mx-auto font-sans relative">
      
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Medical History</h1>
        <p className="mt-2 text-slate-500 text-lg">Manage your upcoming visits and view past appointments.</p>
      </div>

      {fetchError && (
        <div className="p-4 mb-6 text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-xl">
          Failed to load medical history. Please check your connection.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-8">
           <section>
             <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Calendar className="w-5 h-5 text-teal-600" /> Upcoming Visits
             </h2>
             <HistorySkeleton />
             <HistorySkeleton />
           </section>
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* UPCOMING APPOINTMENTS SECTION */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" /> Upcoming Visits
            </h2>
            
            {upcomingApps.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed rounded-3xl border-slate-300 text-slate-500 flex flex-col items-center">
                <Calendar className="w-12 h-12 text-slate-300 mb-3" />
                <p className="font-medium text-lg">You have no upcoming appointments.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {upcomingApps.map((app) => (
                  <div key={app.id} className="group flex flex-col md:flex-row bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    
                    {/* Date/Time Left Panel */}
                    <div className="flex flex-row md:flex-col justify-between md:justify-center p-5 bg-teal-50 border-b md:border-b-0 md:border-r border-teal-100 md:w-56 shrink-0 group-hover:bg-teal-100/50 transition-colors">
                      <div className="flex items-center gap-2 text-teal-800 font-semibold mb-1">
                        <Calendar className="w-4 h-4" /> {formatDate(app.date)}
                      </div>
                      <div className="flex items-center gap-2 text-teal-900 font-extrabold text-lg tracking-tight">
                        <Clock className="w-5 h-5" /> {app.startTime}
                      </div>
                    </div>
                    
                    {/* Center Info Panel */}
                    <div className="flex-1 p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Dr. {app.doctor.lastName}</h3>
                          <p className="text-sm font-medium text-teal-600">{app.doctor.doctorProfile?.specialization}</p>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                      
                      {/* Location & Context Badge */}
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                        {app.type === 'TELEHEALTH' ? (
                          <Video className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        ) : (
                          <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-bold text-slate-800">
                            {app.type === 'TELEHEALTH' ? 'Online Video Call' : 'In-Person Visit'}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">
                            {app.location || 'Location details pending.'}
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Right Actions Panel */}
                    <div className="flex flex-row md:flex-col p-4 border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50 gap-2 justify-center shrink-0 md:w-40">
                      <button 
                        onClick={() => openRescheduleModal(app)}
                        className="flex-1 md:flex-none w-full px-4 py-2.5 text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" /> Reschedule
                      </button>
                      <button 
                        onClick={() => openCancelModal(app.id)}
                        className="flex-1 md:flex-none w-full px-4 py-2.5 text-sm font-bold text-red-700 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* PAST APPOINTMENTS SECTION */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" /> Past History
            </h2>
            
            {pastApps.length === 0 ? (
              <div className="p-8 text-center bg-white border border-dashed rounded-3xl border-slate-300 text-slate-500">
                No past appointments found.
              </div>
            ) : (
              <div className="grid gap-3 opacity-80 hover:opacity-100 transition-opacity">
                {pastApps.map((app) => (
                  <div key={app.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="p-3 bg-slate-50 rounded-full text-slate-400">
                        {app.status === 'COMPLETED' ? <CheckCircle2 className="w-6 h-6 text-teal-500"/> : <XCircle className="w-6 h-6 text-red-400"/>}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">Dr. {app.doctor.lastName}</h3>
                        <p className="text-sm text-slate-500 font-medium">
                          {formatDate(app.date)} at {app.startTime} • {app.type === 'TELEHEALTH' ? 'Online' : 'In-Person'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-0 w-full sm:w-auto sm:text-right">
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      )}

      {/* MODALS */}

      {/* Cancellation Modal */}
      <ConfirmationModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={executeCancel}
        isLoading={isCanceling}
        type="danger"
        title="Cancel Appointment?"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmText="Yes, Cancel Visit"
      />

      {/* Reschedule Modal */}
      {isRescheduleOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-extrabold text-slate-900">Reschedule</h3>
              <button onClick={() => setIsRescheduleOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                Select a new date and time for your appointment with <span className="font-bold text-slate-800">Dr. {selectedAppt?.doctor.lastName}</span>.
              </p>

              <div className="mb-5">
                <label className="block mb-2 text-sm font-bold text-slate-700">New Date</label>
                <input 
                  type="date" 
                  min={today}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800 cursor-pointer hover:border-teal-300 transition-colors"
                />
              </div>

              {newDate && (
                <div className="mb-6 animate-in fade-in duration-300">
                  <label className="block mb-3 text-sm font-bold text-slate-700">Available Slots</label>
                  {loadingSlots ? (
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse border border-slate-200"></div>)}
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                      {availableSlots.map((slot, i) => {
                        const isSelected = selectedNewSlot?.startTime === slot.startTime;
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedNewSlot(slot)}
                            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all duration-200 ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-600 shadow-md transform scale-[1.02]'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:bg-teal-50'
                            }`}
                          >
                            <span className="font-extrabold text-base">{slot.startTime}</span>
                            <span className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider mt-1 font-bold ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                              {slot.type === 'TELEHEALTH' ? (
                                <><Video className="w-3.5 h-3.5" /> Online</>
                              ) : (
                                <><MapPin className="w-3.5 h-3.5" /> Clinic</>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-center text-red-600 bg-red-50 rounded-xl border border-red-100">
                      No slots available on this date.
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={submitReschedule}
                disabled={!selectedNewSlot || isRescheduling}
                className="w-full flex justify-center items-center gap-2 py-3.5 mt-2 font-bold text-white bg-teal-600 shadow-lg shadow-teal-500/30 rounded-xl hover:bg-teal-700 transition-all disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5 disabled:hover:translate-y-0 text-lg"
              >
                {isRescheduling && <Loader2 className="w-5 h-5 animate-spin" />}
                {isRescheduling ? 'Confirming...' : 'Confirm New Time'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientHistory;