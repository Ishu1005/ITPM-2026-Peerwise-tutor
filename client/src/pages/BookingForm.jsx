import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  isBefore, startOfDay, parse, addHours
} from 'date-fns';
import { Calendar as CalIcon, Clock, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import PaymentForm from '../components/PaymentForm';
import BookingSuccessModal from '../components/BookingSuccessModal';
import { PEERWISE_LOGO_URL } from '../constants/brand';
import '../styles/wyzant.css';

function initials(name) {
  return (name || '?').trim()?.[0]?.toUpperCase() || '?';
}

function generateTimeSlots(availStart, availEnd, bookedSlots) {
  if (!availStart || !availEnd) return [];
  const slots = [];
  let curr = parse(availStart, 'HH:mm', new Date());
  const end = parse(availEnd, 'HH:mm', new Date());

  while (isBefore(curr, end)) {
    const slotString = format(curr, 'HH:mm');
    // Assume 1 hour session duration for this mock
    const slotEndString = format(addHours(curr, 1), 'HH:mm');
    
    // Check overlapping
    const isBooked = bookedSlots.some(b => {
      // Very basic collision logic
      return (slotString >= b.startTime && slotString < b.endTime) || 
             (slotEndString > b.startTime && slotEndString <= b.endTime);
    });

    if (!isBooked) {
      slots.push(slotString);
    }
    curr.setHours(curr.getHours() + 1);
  }
  return slots;
}

function BookingForm() {
  const { id: tutorId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tutor, setTutor] = useState(null);
  const [loadingTutor, setLoadingTutor] = useState(true);

  const [step, setStep] = useState(1);
  
  // Date/Time Step States
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Form Details Step
  const [form, setForm] = useState({ 
    subject: searchParams.get('subject') || (tutor?.subjects || [])[0] || 'Peer Tutoring', 
    notes: '' 
  });

  // Update subject if tutor loads and it was empty
  useEffect(() => {
    if (tutor && !form.subject) {
      setForm(p => ({ ...p, subject: tutor.subjects[0] || 'Peer Tutoring' }));
    }
  }, [tutor, form.subject]);
  
  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLoadingTutor(true);
    axios.get(`http://localhost:5000/api/tutors/${tutorId}`, { withCredentials: true })
      .then(res => setTutor(res.data))
      .catch(err => {
        toast.error('Failed to load tutor');
        setTutor(null);
      })
      .finally(() => setLoadingTutor(false));
  }, [tutorId]);

  // Fetch slots when date changes
  useEffect(() => {
    if (!selectedDate || !tutor) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const res = await axios.get(`http://localhost:5000/api/tutors/${tutor._id}/booked-slots?date=${dateStr}`);
        const booked = res.data;
        
        const dayName = format(selectedDate, 'EEEE').toLowerCase();
        const availability = (tutor.availability || []).find(a => a.day === dayName);

        if (!availability || !availability.startTime || !availability.endTime) {
          setAvailableSlots([]);
          return;
        }

        const slots = generateTimeSlots(availability.startTime, availability.endTime, booked);
        
        // Filter out past times if today
        if (isSameDay(selectedDate, new Date())) {
          const nowStr = format(new Date(), 'HH:mm');
          setAvailableSlots(slots.filter(s => s > nowStr));
        } else {
          setAvailableSlots(slots);
        }
      } catch (err) {
        toast.error('Failed to get available times');
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, tutor]);

  // Calendar render logic
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const rows = [];
    let days = [];
    let day = startDate;

    const today = startOfDay(new Date());

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isPast = isBefore(day, today);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        
        // Check if tutor works this day of week generally
        const dayName = format(day, 'EEEE').toLowerCase();
        const hasAvailability = tutor?.availability?.some(a => a.day === dayName && a.startTime);

        days.push(
          <button
            type="button"
            key={day}
            disabled={!isSameMonth(day, monthStart) || isPast || !hasAvailability}
            onClick={() => { setSelectedDate(cloneDay); setSelectedTime(null); }}
            className={`
              w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold transition-all
              ${!isSameMonth(day, monthStart) || isPast ? 'text-gray-300 cursor-not-allowed' : 
                !hasAvailability ? 'text-gray-400 bg-gray-50' :
                isSelected ? 'bg-wyzant-teal text-white shadow-md transform scale-105' : 
                'text-gray-700 hover:bg-teal-50 hover:text-wyzant-teal'
              }
            `}
          >
            {format(day, 'd')}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="flex justify-between w-full mb-2" key={day}>{days}</div>);
      days = [];
    }
    return rows;
  };

  const handleNext = () => setStep(p => p + 1);
  const handleBack = () => setStep(p => p - 1);

  const confirmBooking = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      // Calculate endTime (assume +1 hour layout)
      const endHrs = parseInt(selectedTime.split(':')[0]) + 1;
      const endMins = selectedTime.split(':')[1];
      const endTime = `${endHrs.toString().padStart(2, '0')}:${endMins}`;

      await axios.post('http://localhost:5000/api/bookings', {
        tutorId,
        subject: form.subject || tutor.subjects[0] || 'Peer Tutoring',
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedTime,
        endTime,
        notes: form.notes,
        paymentMethod: 'mock_stripe'
      }, { withCredentials: true });
      
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTutor) return <div className="min-h-screen flex justify-center items-center font-bold text-gray-500">Loading Scheduling UI...</div>;
  if (!tutor) return <div className="min-h-screen flex justify-center items-center font-bold text-red-500">Tutor not found</div>;

  const hourlyRate = tutor.hourlyRate || 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 py-4 px-6 fixed top-0 w-full z-10 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src={PEERWISE_LOGO_URL} alt="PeerWise" className="h-9 w-auto max-w-[180px] object-contain" />
        </div>
        {!success && <button onClick={() => navigate(-1)} className="text-sm font-semibold text-gray-500 hover:text-gray-800">Cancel</button>}
      </header>

      {/* SUCCESS MODAL FULLSCREEN COMPONENT */}
      <BookingSuccessModal 
        success={success} 
        tutorFullName={tutor.fullName} 
        selectedDate={selectedDate} 
        selectedTime={selectedTime} 
      />

      <main className="flex-1 max-w-5xl mx-auto w-full pt-28 pb-12 px-4 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* LEFT COMPONENT - TUTOR INFO FIXED */}
        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 self-start md:sticky md:top-28">
          <div className="flex flex-col items-center text-center border-b border-gray-100 pb-6 mb-6">
            <div className="w-20 h-20 bg-wyzant-teal text-white rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-md">
              {initials(tutor.fullName)}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{tutor.fullName}</h2>
            <p className="text-gray-500 text-sm mt-1 mb-2">{(tutor.subjects || []).join(' • ')}</p>
            <span className="bg-wyzant-teal-light text-peerwise-navy font-bold px-3 py-1 rounded-full text-sm tracking-wide">
              Rs. {hourlyRate} / hr
            </span>
          </div>
          
          <div className="space-y-4">
            {selectedDate && (
              <div className="flex items-start gap-3">
                <CalIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="text-gray-700 font-medium">{format(selectedDate, 'EEEE, MMMM do, yyyy')}</div>
              </div>
            )}
            {selectedTime && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="text-gray-700 font-medium">{selectedTime} - {parseInt(selectedTime.split(':')[0])+1}:{selectedTime.split(':')[1]} (1 hr)</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COMPONENT - STEPPER FLOW */}
        <div className="md:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[500px] flex flex-col">
          
          {/* STEP PROGRESS */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">
              {step === 1 ? 'Select a Time' : step === 2 ? 'Session Details' : 'Secure Checkout'}
            </h1>
            <div className="flex gap-2 text-sm font-semibold">
              <span className={step >= 1 ? 'text-wyzant-teal' : 'text-gray-300'}>Time</span>
              <span className="text-gray-300">›</span>
              <span className={step >= 2 ? 'text-wyzant-teal' : 'text-gray-300'}>Details</span>
              <span className="text-gray-300">›</span>
              <span className={step >= 3 ? 'text-wyzant-teal' : 'text-gray-300'}>Payment</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col sm:flex-row gap-8">
                
                {/* CALENDAR */}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
                    <div className="font-bold text-gray-800">{format(currentMonth, 'MMMM yyyy')}</div>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight className="w-5 h-5" /></button>
                  </div>
                  <div className="flex justify-between w-full mb-4 text-xs font-bold text-gray-400 uppercase">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="w-10 text-center">{d}</div>)}
                  </div>
                  <div className="flex flex-col w-full">
                    {renderCalendar()}
                  </div>
                </div>

                {/* SLOTS COLUMN */}
                {selectedDate && (
                  <div className="w-full sm:w-48 border-l border-gray-100 pl-8 overflow-y-auto max-h-[340px] pr-2 custom-scrollbar">
                    <div className="font-medium text-gray-600 mb-4">{format(selectedDate, 'EEEE, MMM d')}</div>
                    
                    {loadingSlots ? (
                      <div className="animate-pulse space-y-3">
                        <div className="h-12 bg-gray-100 rounded-lg w-full"></div>
                        <div className="h-12 bg-gray-100 rounded-lg w-full"></div>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {availableSlots.map(time => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`py-3 px-4 rounded-xl border text-center font-bold transition-all ${
                              selectedTime === time 
                                ? 'bg-wyzant-teal border-wyzant-teal text-white shadow-md transform scale-[1.02]' 
                                : 'border-gray-200 text-wyzant-teal hover:border-wyzant-teal hover:bg-teal-50'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No available times.</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Subject Selection</label>
                  <select 
                    value={form.subject} 
                    onChange={e => setForm({...form, subject: e.target.value})}
                    className="w-full border-gray-300 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wyzant-teal"
                  >
                    <option value="" disabled>Select the subject you need help with...</option>
                    {(tutor.subjects || ['Peer Tutoring']).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Notes for {tutor.fullName} (Optional)</label>
                  <textarea 
                    value={form.notes} 
                    onChange={e => setForm({...form, notes: e.target.value})}
                    placeholder="Share what you'd like to cover in this session to help the tutor prepare..."
                    rows={4}
                    className="w-full border-gray-300 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wyzant-teal resize-none"
                  ></textarea>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                <PaymentForm 
                  payment={payment} 
                  setPayment={setPayment} 
                  confirmBooking={confirmBooking} 
                  submitting={submitting} 
                  hourlyRate={hourlyRate} 
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* NEXT/PREV BUTTONS */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
            {step > 1 ? (
              <button disabled={submitting} onClick={handleBack} className="px-6 py-2.5 rounded-lg border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Back
              </button>
            ) : <div></div>}

            {step === 1 && (
              <button 
                onClick={handleNext} 
                disabled={!selectedDate || !selectedTime}
                className={`px-8 py-3 rounded-lg font-bold transition-all shadow-md ${!selectedDate || !selectedTime ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-wyzant-teal text-white hover:bg-wyzant-teal-dark'}`}
              >
                Next Step
              </button>
            )}
            
            {step === 2 && (
              <button 
                onClick={handleNext} 
                disabled={!form.subject}
                className={`px-10 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${!form.subject ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-100'}`}
              >
                Proceed to Payment
              </button>
            )}

            {step === 3 && (
              <div className="w-full flex justify-end">
                {/* Submit handled inside PaymentForm to match Wyzant UI exactly */}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default BookingForm;
