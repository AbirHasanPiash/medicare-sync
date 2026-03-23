import { useState } from 'react';
import useSWR from 'swr';
import api, { fetcher } from '../utils/api';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import { 
  Clock, MapPin, Video, Plus, Trash2, 
  CalendarDays, AlertCircle, Loader2 
} from 'lucide-react';

// Skeleton Component
const AvailabilitySkeleton = () => (
  <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm animate-pulse mb-3">
    <div className="space-y-2 w-full">
      <div className="h-5 bg-slate-200 rounded w-1/3"></div>
      <div className="h-4 bg-slate-100 rounded w-1/2"></div>
    </div>
    <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0 ml-4"></div>
  </div>
);

const ManageAvailability = () => {
  // Form State
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState('IN_PERSON');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Fetch Existing Availability
  const { data: availabilities, isLoading, error, mutate } = useSWR('/appointments/availabilities', fetcher);

  // Handle Form Submit
  const handleAddAvailability = async (e) => {
    e.preventDefault();
    if (!startTime || !endTime) return toast.error('Please provide both start and end times.');
    if (startTime >= endTime) return toast.error('End time must be after start time.');
    if (!location.trim()) return toast.error(type === 'IN_PERSON' ? 'Please provide a clinic address.' : 'Please provide a meeting link.');

    setIsSubmitting(true);

    try {
      await api.post('/appointments/availabilities', {
        dayOfWeek,
        startTime,
        endTime,
        type,
        location
      });

      toast.success('Availability block added!');
      // Reset form but keep the day the same for quick sequential adding
      setStartTime('');
      setEndTime('');
      setLocation('');
      mutate(); // Re-fetch data
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add availability.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const confirmDelete = (id) => {
    setBlockToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      // Optimistic update
      mutate(availabilities.filter(a => a.id !== blockToDelete), false);
      await api.delete(`/appointments/availabilities/${blockToDelete}`);
      mutate();
      toast.success('Block removed from your schedule.');
      setDeleteModalOpen(false);
    } catch (err) {
      toast.error('Failed to remove block. Please check connection.');
      mutate();
    } finally {
      setIsDeleting(false);
      setBlockToDelete(null);
    }
  };

  // Group availabilities by day for a clean UI
  const groupedAvailabilities = daysList.reduce((acc, day) => {
    const blocksForDay = availabilities?.filter(a => a.dayOfWeek === day) || [];
    // Sort chronologically
    if (blocksForDay.length > 0) {
      acc[day] = blocksForDay.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto font-sans relative">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clinic & Telehealth Hours</h1>
        <p className="mt-2 text-slate-500 text-lg">Define when and where you are available to see patients.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Add Form (Sticky) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 transition-all duration-500">
          <div className="p-6 md:p-8 bg-white border border-slate-200 rounded-3xl shadow-lg shadow-slate-200/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-teal-600" />
              Add Time Block
            </h2>

            <form onSubmit={handleAddAvailability}>
              
              {/* Type Toggle */}
              <div className="flex p-1 mb-6 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('IN_PERSON')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    type === 'IN_PERSON' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <MapPin className="w-4 h-4" /> In-Person
                </button>
                <button
                  type="button"
                  onClick={() => setType('TELEHEALTH')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    type === 'TELEHEALTH' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Video className="w-4 h-4" /> Telehealth
                </button>
              </div>

              <div className="mb-5">
                <label className="block mb-2 text-sm font-bold text-slate-700">Day of the Week</label>
                <select 
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 font-medium hover:border-teal-300 cursor-pointer"
                >
                  {daysList.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block mb-2 text-sm font-bold text-slate-700">Start Time</label>
                  <input 
                    type="time" 
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800 hover:border-teal-300"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-bold text-slate-700">End Time</label>
                  <input 
                    type="time" 
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800 hover:border-teal-300"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-bold text-slate-700">
                  {type === 'IN_PERSON' ? 'Clinic Address / Room No.' : 'Meeting Link (Zoom/Meet)'}
                </label>
                <input 
                  type="text" 
                  required
                  placeholder={type === 'IN_PERSON' ? "e.g. City Hospital, Room 302" : "e.g. https://zoom.us/j/123456"}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 hover:border-teal-300 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 font-bold text-white transition-all shadow-md bg-teal-600 rounded-xl hover:bg-teal-700 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 text-lg"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                {isSubmitting ? 'Saving...' : 'Add to Schedule'}
              </button>
            </form>
            
            <div className="mt-6 flex items-start gap-3 p-4 bg-teal-50 rounded-xl border border-teal-100">
              <AlertCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <p className="text-xs text-teal-800 leading-relaxed font-medium">
                These blocks dictate your weekly availability. The system will automatically split these times into bookable slots based on your profile's slot duration.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Weekly Schedule List */}
        <div className="lg:col-span-7 space-y-8">
          
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
              Failed to load your schedule. Please refresh.
            </div>
          )}

          {isLoading ? (
             <div className="space-y-3">
               {[1, 2, 3, 4].map(i => <AvailabilitySkeleton key={i} />)}
             </div>
          ) : Object.keys(groupedAvailabilities).length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed rounded-3xl border-slate-300 h-64">
              <CalendarDays className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium text-lg">Your weekly schedule is empty.</p>
              <p className="text-slate-400 text-sm mt-1">Use the panel to add your working hours.</p>
            </div>
          ) : (
            // Render each day that has availabilities
            daysList.map((day) => {
              const blocks = groupedAvailabilities[day];
              if (!blocks) return null;

              return (
                <div key={day} className="mb-6 animate-in fade-in">
                  <h3 className="text-lg font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    {day}
                  </h3>
                  <div className="space-y-3">
                    {blocks.map((block) => (
                      <div 
                        key={block.id} 
                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:shadow-md hover:border-teal-200 transition-all duration-200 gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-full ${block.type === 'TELEHEALTH' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'}`}>
                            {block.type === 'TELEHEALTH' ? <Video className="w-5 h-5"/> : <MapPin className="w-5 h-5"/>}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-lg tracking-tight">
                              {block.startTime} - {block.endTime}
                            </p>
                            <p className="text-sm font-medium text-slate-500 mt-0.5">
                              {block.location}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => confirmDelete(block.id)}
                          className="p-2.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-xl transition-colors shrink-0 self-start sm:self-center"
                          title="Remove Block"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executeDelete}
        isLoading={isDeleting}
        type="danger"
        title="Remove Availability?"
        message="Are you sure you want to delete this time block? Patients will no longer be able to book appointments during this time."
        confirmText="Yes, Remove"
      />

    </div>
  );
};

export default ManageAvailability;