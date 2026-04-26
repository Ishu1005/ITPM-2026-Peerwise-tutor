import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Video, MessageCircle, Calendar, User, ArrowRight } from 'lucide-react';
import { PEERWISE_LOGO_URL } from '../constants/brand';

const MeetTutorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tutorName = searchParams.get('tutor') || 'Your Tutor';
  const subject = searchParams.get('subject') || 'Lesson';
  const date = searchParams.get('date') || 'Tomorrow';
  const time = searchParams.get('time') || '10:00 AM';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full"
      >
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-50">
          <CheckCircle size={64} strokeWidth={2.5} />
        </div>
        
        <h1 className="text-4xl font-black text-gray-900 mb-4">You're All Set!</h1>
        <p className="text-gray-500 text-xl mb-12">Successful booking with your expert tutor.</p>

        <div className="bg-gray-50 rounded-3xl p-8 mb-12 border border-gray-100 text-left space-y-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-teal-600 shadow-sm border border-gray-100">
              <User size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tutor</p>
              <p className="text-xl font-bold text-gray-900">{tutorName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-gray-100">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Session Details</p>
              <p className="text-xl font-bold text-gray-900 font-serif">{subject} on {date} @ {time}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ y: -4 }}
            className="bg-wyzant-teal text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-xl shadow-teal-100 hover:bg-wyzant-teal-dark transition-all"
          >
            <Video size={24} /> MEET TUTOR
          </motion.button>
          
          <motion.button
            whileHover={{ y: -4 }}
            className="border-2 border-gray-200 text-gray-600 py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
            onClick={() => navigate('/my-bookings')}
          >
            <MessageCircle size={24} /> MESSAGES
          </motion.button>
        </div>

        <button 
          onClick={() => navigate('/find-tutor')}
          className="mt-12 flex items-center gap-2 mx-auto text-gray-400 hover:text-gray-900 font-bold transition-colors"
        >
          Book Another Session <ArrowRight size={18} />
        </button>
      </motion.div>
    </div>
  );
};

export default MeetTutorPage;
