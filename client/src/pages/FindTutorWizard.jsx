import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, UserPlus, Monitor } from 'lucide-react';
import { PEERWISE_LOGO_URL } from '../constants/brand';

const WizardEntry = () => {
  const navigate = useNavigate();

  const options = [
    {
      id: 'search',
      title: 'Search for Tutors',
      description: 'Browse our extensive list of expert tutors to find your perfect match.',
      icon: Search,
      color: 'bg-teal-500',
      action: () => navigate('/subject-selection?mode=search')
    },
    {
      id: 'request',
      title: 'Request a Tutor',
      description: 'Tell us what you need, and we will match you with the best tutors.',
      icon: UserPlus,
      color: 'bg-blue-600',
      action: () => navigate('/subject-selection?mode=request')
    },
    {
      id: 'online',
      title: 'Online Tutoring',
      description: 'Connect with expert tutors instantly through our virtual classrooms.',
      icon: Monitor,
      color: 'bg-purple-600',
      action: () => navigate('/subject-selection?mode=online')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={PEERWISE_LOGO_URL} alt="Logo" className="h-12 w-auto" />
          <h1 className="text-4xl font-bold text-gray-900">Let's find the best fit for you.</h1>
        </div>
        
        <p className="text-gray-600 text-xl mb-12 max-w-2xl mx-auto">
          Choose how you want to discover your tutor today.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {options.map((opt, idx) => (
            <motion.div
              key={opt.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              onClick={opt.action}
              className="bg-white rounded-3xl p-8 shadow-xl cursor-pointer hover:shadow-2xl transition-all border border-gray-100 flex flex-col items-center text-center group"
            >
              <div className={`w-16 h-16 ${opt.color} rounded-2xl flex items-center justify-center text-white mb-6 transform group-hover:rotate-6 transition-transform shadow-lg`}>
                <opt.icon size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{opt.title}</h3>
              <p className="text-gray-500 leading-relaxed">
                {opt.description}
              </p>
              <div className="mt-8 font-semibold text-teal-600 group-hover:translate-x-1 transition-transform flex items-center gap-2">
                Get Started <span>→</span>
              </div>
            </motion.div>
          ))}
        </div>

        <button 
          onClick={() => navigate('/tutors')}
          className="mt-16 text-gray-500 hover:text-gray-800 font-medium border-b border-gray-300 hover:border-gray-800 transition-colors"
        >
          I want to browse all tutors manually
        </button>
      </motion.div>
    </div>
  );
};

export default WizardEntry;
