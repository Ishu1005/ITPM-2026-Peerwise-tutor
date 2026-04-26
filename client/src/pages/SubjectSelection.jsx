import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, ChevronLeft } from 'lucide-react';

const SubjectSelection = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'search';
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/api/modules');
        setSuggestions(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setSuggestions([
          { title: 'Java', code: 'JAVA' },
          { title: 'React', code: 'REACT' },
          { title: 'Python', code: 'PYTHON' },
          { title: 'DBMS', code: 'DBMS' },
          { title: 'DSA', code: 'DSA' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, []);

  const handleNext = () => {
    const finalSubject = selectedSubject ? selectedSubject.title : input;
    if (!finalSubject.trim()) return;
    
    navigate(`/tutors?subject=${encodeURIComponent(finalSubject)}&mode=${mode}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pt-24">
      <div className="max-w-2xl w-full">
        <button 
          onClick={() => navigate(-1)} 
          className="group mb-12 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-semibold"
        >
          <ChevronLeft className="group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">What do you want to learn?</h1>
          <p className="text-gray-500 text-xl mb-12">Search among 500+ subjects and skills.</p>

          <div className="relative mb-12">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={28} />
            </div>
            <input
              type="text"
              placeholder="Enter a subject (e.g. Java, DBMS, React)"
              className="w-full h-20 pl-20 pr-6 text-2xl border-2 border-gray-100 rounded-3xl focus:border-teal-500 outline-none transition-all shadow-xl hover:shadow-2xl focus:shadow-teal-100 placeholder:text-gray-300"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setSelectedSubject(null);
              }}
            />
          </div>

          <div className="mb-16">
            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-6">Popular Skills</h3>
            <div className="flex flex-wrap gap-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="w-24 h-10 bg-gray-100 rounded-full animate-pulse" />
                ))
              ) : (
                suggestions.map((s, idx) => (
                  <motion.button
                    key={s.code || s._id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedSubject(s);
                      setInput(s.title);
                    }}
                    className={`px-6 py-3 rounded-full font-bold text-lg transition-all border-2 ${
                      input === s.title 
                        ? 'bg-teal-500 text-white border-teal-500 shadow-xl shadow-teal-200' 
                        : 'bg-white text-gray-600 border-gray-100 hover:border-teal-200 hover:text-teal-600'
                    }`}
                  >
                    {s.title}
                  </motion.button>
                ))
              )}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            disabled={!input.trim()}
            className={`w-full h-16 rounded-2xl font-bold text-2xl flex items-center justify-center gap-3 transition-all ${
              input.trim() 
                ? 'bg-orange-500 text-white shadow-xl shadow-orange-100 hover:bg-orange-600' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            NEXT <ArrowRight size={24} />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default SubjectSelection;
