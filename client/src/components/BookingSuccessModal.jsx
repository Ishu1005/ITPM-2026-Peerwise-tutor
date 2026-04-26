import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

function BookingSuccessModal({ success, tutorFullName, selectedDate, selectedTime }) {
  const navigate = useNavigate();

  if (!success) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center"
      >
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
        </motion.div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Booking Confirmed!</h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md">
          Your session with {tutorFullName} has been scheduled for {format(selectedDate, 'EEEE, MMMM do')} at {selectedTime}. An in-app confirmation and email have been dispatched.
        </p>
        <button onClick={() => navigate('/my-bookings')} className="bg-wyzant-teal hover:bg-wyzant-teal-dark text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors shadow-lg">
          View My Bookings
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export default BookingSuccessModal;
