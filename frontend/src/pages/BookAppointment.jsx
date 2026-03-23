import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import api, { fetcher } from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Calendar, Clock, User, Stethoscope, ChevronRight, 
  CheckCircle2, MapPin, Video, Loader2 
} from 'lucide-react';

// Skeleton Components
const DoctorSkeleton = () => (
  <div className="p-5 border border-slate-100 rounded-2xl bg-white animate-pulse flex items-start gap-4 shadow-sm">
    <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0"></div>
    <div className="flex-1 space-y-2 py-1">
      <div className="h-5 bg-slate-200 rounded w-3/4"></div>
      <div className="h-4 bg-slate-100 rounded w-1/2"></div>
    </div>
  </div>
);

const SlotsSkeleton = () => (
  <div className="grid grid-cols-2 gap-3">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse border border-slate-200"></div>
    ))}
  </div>
);

const BookAppointment = () => {
  // UI State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);

  // Ref for mobile auto-scrolling
  const bookingPanelRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];

  // Fetch Doctors Directory
  const { 
    data: doctors, 
    error: doctorsError, 
    isLoading: loadingDoctors 
  } = useSWR('/appointments/doctors', fetcher);

  // Conditional Fetching for Slots
  const { 
    data: slotsData, 
    error: slotsError, 
    isLoading: loadingSlots 
  } = useSWR(
    selectedDoctor && selectedDate 
      ? `/appointments/slots?doctorId=${selectedDoctor.id}&date=${selectedDate}` 
      : null, 
    fetcher
  );

  const slots = slotsData?.slots || [];
  const slotMessage = slotsData?.message || '';

  // Reset selected slot if the user changes the date or doctor
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate, selectedDoctor]);

  // Handle Doctor Selection with Mobile Auto-Scroll
  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    // Add a tiny delay to allow the DOM to render the right panel before scrolling
    setTimeout(() => {
      bookingPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      return toast.error('Please select a doctor, date, and time slot.');
    }

    setBooking(true);

    try {
      // NOW SENDING THE DYNAMIC TYPE & LOCATION FROM THE SELECTED SLOT!
      await api.post('/appointments/book', {
        doctorId: selectedDoctor.id,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason,
        type: selectedSlot.type,
        location: selectedSlot.location
      });

      toast.success('Appointment confirmed successfully!');
      
      // Instantly reset the form
      setSelectedDoctor(null);
      setSelectedDate('');
      setSelectedSlot(null);
      setReason('');

      // Scroll back to top on success for mobile users
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to book appointment.');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto font-sans relative">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Book an Appointment</h1>
        <p className="mt-2 text-slate-500 text-lg">Select a specialist and find a time that works for you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Doctor Directory */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            Step 1: Choose a Specialist
          </h2>

          {doctorsError && (
            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl">Failed to load directory.</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loadingDoctors ? (
              [...Array(6)].map((_, i) => <DoctorSkeleton key={i} />)
            ) : (
              doctors?.map((doctor) => (
                <div 
                  key={doctor.id}
                  onClick={() => handleDoctorSelect(doctor)}
                  className={`group relative p-5 cursor-pointer transition-all duration-300 border rounded-2xl bg-white ${
                    selectedDoctor?.id === doctor.id 
                      ? 'border-teal-500 ring-4 ring-teal-500/10 shadow-md transform -translate-y-1' 
                      : 'border-slate-200 hover:border-teal-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                        selectedDoctor?.id === doctor.id ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-600 group-hover:bg-teal-100'
                      }`}>
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">Dr. {doctor.lastName}</h3>
                        <p className="text-sm font-medium text-teal-600">{doctor.doctorProfile?.specialization}</p>
                      </div>
                    </div>
                    {selectedDoctor?.id === doctor.id && (
                      <CheckCircle2 className="w-6 h-6 text-teal-500 animate-in zoom-in duration-200" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Date & Time Selection */}
        <div 
          ref={bookingPanelRef} 
          className="lg:col-span-5 lg:sticky lg:top-24 transition-all duration-500 scroll-mt-24"
        >
          <div className={`transition-all duration-500 ${selectedDoctor ? 'opacity-100 translate-y-0' : 'opacity-40 pointer-events-none translate-y-4'}`}>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-teal-600" />
              Step 2: Pick Date & Time
            </h2>

            <div className="p-6 md:p-8 bg-white border border-slate-200 rounded-3xl shadow-lg shadow-slate-200/50">
              
              {selectedDoctor && (
                <div className="mb-6 pb-6 border-b border-slate-100 flex items-center gap-3">
                   <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">
                     <User className="w-5 h-5" />
                   </div>
                   <div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booking with</p>
                     <p className="font-bold text-slate-800">Dr. {selectedDoctor.lastName}</p>
                   </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block mb-2 text-sm font-bold text-slate-700">Select Date</label>
                <input 
                  type="date" 
                  min={today}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-800 font-medium hover:border-teal-300 cursor-pointer"
                />
              </div>

              {selectedDate && (
                <div className="mb-6 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-600" /> 
                      Available Slots
                    </label>
                  </div>
                  
                  {loadingSlots ? (
                    <SlotsSkeleton />
                  ) : slotsError ? (
                    <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">Failed to load slots.</div>
                  ) : slots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                      {slots.map((slot, index) => {
                        const isSelected = selectedSlot?.startTime === slot.startTime;
                        return (
                          <button
                            key={index}
                            onClick={() => setSelectedSlot(slot)}
                            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all duration-200 ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-600 shadow-md transform scale-[1.02]'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:bg-teal-50'
                            }`}
                          >
                            <span className="font-extrabold text-base">{slot.startTime}</span>
                            <span className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wider mt-1 font-bold ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
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
                    <div className="p-6 text-sm text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 border-dashed flex flex-col items-center gap-2">
                      <Calendar className="w-8 h-8 text-slate-300" />
                      {slotMessage || "No slots available for this date."}
                    </div>
                  )}
                </div>
              )}

              {/* Show full location details for the selected slot */}
              {selectedSlot && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pt-2 border-t border-slate-100 mt-2">
                  
                  <div className="flex items-start gap-3 p-4 mb-6 bg-slate-50 rounded-xl border border-slate-100">
                    {selectedSlot.type === 'TELEHEALTH' ? (
                      <Video className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    ) : (
                      <MapPin className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {selectedSlot.type === 'TELEHEALTH' ? 'Telehealth Video Call' : 'In-Person Visit'}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {selectedSlot.location || 'Location details will be provided upon confirmation.'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block mb-2 text-sm font-bold text-slate-700">Reason for Visit (Optional)</label>
                    <textarea 
                      rows="3"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="E.g., Routine checkup, fever, consultation..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-slate-800 resize-none hover:border-teal-300"
                    ></textarea>
                  </div>

                  <button
                    onClick={handleBookAppointment}
                    disabled={booking}
                    className="w-full flex items-center justify-center gap-2 px-4 py-4 font-bold text-white transition-all shadow-lg shadow-teal-500/30 bg-teal-600 rounded-xl hover:bg-teal-700 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none text-lg"
                  >
                    {booking && <Loader2 className="w-5 h-5 animate-spin" />}
                    {booking ? 'Confirming...' : 'Confirm Appointment'}
                    {!booking && <ChevronRight className="w-5 h-5" />}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BookAppointment;