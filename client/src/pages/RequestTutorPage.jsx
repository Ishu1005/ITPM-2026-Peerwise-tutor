import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { ChevronLeft, Send, Calendar, Clock, MessageSquare } from 'lucide-react';
import { PEERWISE_LOGO_URL } from '../constants/brand';

const RequestTutorPage = () => {
  const { id: tutorId } = useParams();
  const [searchParams] = useSearchParams();
  const subject = searchParams.get('subject') || '';
  const navigate = useNavigate();

  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/tutors/${tutorId}`, { withCredentials: true })
      .then(res => {
        setTutor(res.data);
        setLoading(false);
      })
      .catch(err => {
        toast.error('Failed to load tutor details');
        navigate('/tutors');
      });
  }, [tutorId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/tutor-requests', {
        tutorId,
        subject,
        message,
        preferredDate: date,
        preferredTime: time,
        flowMode: 'request'
      }, { withCredentials: true });

      toast.success('Your request has been sent successfully!');
      navigate('/my-bookings'); // Or a "Request Sent" page
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Loading Request Form...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-semibold mb-8"
        >
          <ChevronLeft size={20} /> Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* LEFT: Tutor Info */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 text-center">
              <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg border-2 border-white">
                <img 
                  src={tutor?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor?.fullName)}&background=random`} 
                  alt={tutor?.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{tutor?.fullName}</h2>
              <p className="text-teal-600 font-bold mt-1">Rs. {tutor?.hourlyRate}/hr</p>
              
              <div className="mt-6 pt-6 border-t border-gray-50 text-left space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <MessageSquare size={18} className="text-gray-400" />
                  <span className="text-sm font-medium">Fast response time</span>
                </div>
                <div className="bg-teal-50 rounded-xl p-4 text-xs text-teal-800 font-semibold leading-relaxed">
                   You are requesting help with: <br/>
                   <span className="text-teal-900 text-sm block mt-1">"{subject}"</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Request Form */}
          <div className="md:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tell Us More</h1>
              <p className="text-gray-500 mb-8 font-medium">Share your goals and requirements with {tutor?.fullName}.</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Send a personal note</label>
                  <textarea
                    rows={6}
                    placeholder="Ex: 'Hi, I have a big exam coming up in Java and I need help with recursion and data structures...'"
                    className="w-full rounded-2xl border-2 border-gray-100 p-4 focus:border-teal-500 outline-none transition-all placeholder:text-gray-300 text-lg resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Preferred Date (Optional)</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="date"
                        className="w-full rounded-xl border-2 border-gray-100 pl-12 pr-4 py-3 focus:border-teal-500 outline-none transition-all"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Preferred Time (Optional)</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="time"
                        className="w-full rounded-xl border-2 border-gray-100 pl-12 pr-4 py-3 focus:border-teal-500 outline-none transition-all"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3 transition-all ${
                    submitting ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-wyzant-teal text-white hover:bg-wyzant-teal-dark shadow-xl shadow-teal-100'
                  }`}
                >
                  {submitting ? 'Sending...' : 'SEND REQUEST'} <Send size={20} />
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestTutorPage;
