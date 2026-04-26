import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { PEERWISE_LOGO_URL } from '../constants/brand';
import '../styles/wyzant.css';

/** Local portraits in `public/images/home/avatars/` (Unsplash, permanent in repo). */
const TUTOR_AVATAR = idx => `/images/home/avatars/avatar-${idx % 8}.jpg`;

function Home() {
  const [tutors, setTutors] = useState([]);
  const [subjectQuery, setSubjectQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const navigate = useNavigate();
  const howItWorksRef = useRef(null);
  const subjectsRef = useRef(null);
  const javaSectionRef = useRef(null);

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/tutors')
      .then(res => setTutors(res.data))
      .catch(() => toast.error('Failed to load tutors'));
  }, []);

  const slideLeftVariant = {
    hidden: { opacity: 0, x: -100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8 } },
  };

  const slideRightVariant = {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8 } },
  };

  const slideUpVariant = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  };

  const handleSearch = e => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (subjectQuery.trim()) params.append('subject', subjectQuery.trim());
    if (locationQuery.trim()) params.append('location', locationQuery.trim());
    if (selectedLevel !== 'all') params.append('level', selectedLevel);
    
    const queryString = params.toString();
    navigate(`/tutors${queryString ? '?' + queryString : ''}`);
  };

  const subjectCards = [
    { emoji: '💻', name: 'IT1010', color: 'bg-blue-100' },
    { emoji: '📊', name: 'IT1020', color: 'bg-green-100' },
    { emoji: '⚙️', name: 'IT3010', color: 'bg-purple-100' },
    { emoji: '🌐', name: 'IT3040', color: 'bg-yellow-100' },
    { emoji: '🛠️', name: 'IT2010', color: 'bg-red-100' },
    { emoji: '📚', name: 'Other Modules', color: 'bg-indigo-100' },
  ];

  const subjectCount = subjectName => {
    const known = new Set(subjectCards.map(s => s.name));

    if (subjectName === 'Other Modules') {
      return tutors.filter(t => {
        const list = Array.isArray(t.subjects) ? t.subjects : [];
        return list.length > 0 && list.every(s => !known.has(s));
      }).length;
    }

    return tutors.filter(t => (Array.isArray(t.subjects) ? t.subjects : []).includes(subjectName)).length;
  };

  return (
    <>
      {/* Wyzant-style redesigned layout */}
      <div className="min-h-screen bg-white overflow-x-hidden">
        {/* SECTION 2 - HERO */}
        <section className="pt-16 bg-gradient-to-br from-wyzant-teal-light via-white to-teal-50/40">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <motion.div
              variants={slideUpVariant}
              initial="hidden"
              animate="visible"
              className="text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center bg-wyzant-teal-light text-teal-900 rounded-full px-4 py-2 text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Trusted by 50,000+ students worldwide
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Find the perfect tutor for
                <span className="text-wyzant-teal"> any subject</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
                Connect with expert tutors for 1-on-1 personalized learning. 
                <span className="font-semibold text-gray-900"> Your first session is guaranteed.</span>
              </p>

              {/* Enhanced Search Bar */}
              <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl p-2 max-w-4xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1 flex items-center px-4 py-3">
                    <span className="text-gray-400 mr-3">🔍</span>
                    <input
                      value={subjectQuery}
                      onChange={e => setSubjectQuery(e.target.value)}
                      placeholder="What subject do you need help with?"
                      className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                    />
                  </div>
                  
                  <div className="flex items-center px-4 py-3 border-l border-gray-200">
                    <span className="text-gray-400 mr-3">📍</span>
                    <input
                      value={locationQuery}
                      onChange={e => setLocationQuery(e.target.value)}
                      placeholder="City or online"
                      className="outline-none text-gray-700 placeholder-gray-400 w-32"
                    />
        </div>
                  
                  <div className="flex items-center px-4 py-3 border-l border-gray-200">
                    <select
                      value={selectedLevel}
                      onChange={e => setSelectedLevel(e.target.value)}
                      className="outline-none text-gray-700 bg-transparent"
                    >
                      <option value="all">All Levels</option>
                      <option value="elementary">Elementary</option>
                      <option value="middle">Middle School</option>
                      <option value="high">High School</option>
                      <option value="college">College</option>
                      <option value="adult">Adult Learner</option>
                    </select>
      </div>
                  
                  <button
                    type="submit"
                    className="bg-wyzant-teal text-white px-8 py-3 rounded-xl font-medium hover:bg-wyzant-teal-dark transition-colors"
                  >
                    Search Tutors
                  </button>
                </div>
              </form>

              {/* Popular Searches */}
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                <span className="text-gray-500">Popular:</span>
                {['IT1010', 'IT1020', 'IT3010', 'IT3040', 'IT2010'].map(term => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setSubjectQuery(term)}
                    className="text-wyzant-link hover:text-wyzant-teal-dark hover:underline font-medium"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Stats Section */}
            <motion.div
              variants={slideUpVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto"
            >
              {[
                { number: '75,000+', label: 'Expert Tutors' },
                { number: '1M+', label: 'Lessons Taught' },
                { number: '300+', label: 'Subjects' },
                { number: '4.9/5', label: 'Average Rating' }
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{stat.number}</div>
                  <div className="text-gray-600 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* SECTION 3 - HOW IT WORKS */}
        <section ref={howItWorksRef} className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
        <motion.div
          variants={slideRightVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">How PeerWise Works</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Get personalized help in three simple steps
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: 1,
                  title: 'Search for tutors',
                  description: 'Browse our network of expert tutors by subject, location, and availability.',
                  icon: '🔍'
                },
                {
                  step: 2,
                  title: 'Book your lesson',
                  description: 'Choose a time that works for you and book instantly online.',
                  icon: '📅'
                },
                {
                  step: 3,
                  title: 'Start learning',
                  description: 'Meet with your tutor and achieve your learning goals.',
                  icon: '🎓'
                }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={slideUpVariant}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-wyzant-teal-light rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
                    {item.icon}
                  </div>
                  <div className="text-sm font-medium text-wyzant-teal mb-2">STEP {item.step}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
            </div>
          </div>
        </section>

        {/* SECTION 4 - SUBJECTS */}
        <section ref={subjectsRef} className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              variants={slideLeftVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Browse by Subject</h2>
              <p className="text-xl text-gray-600">Find tutors in 300+ subjects</p>
        </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {subjectCards.map(s => {
                const count = subjectCount(s.name);
                return (
        <motion.div
                    key={s.name}
                    variants={slideUpVariant}
          initial="hidden"
          whileInView="visible"
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => navigate(`/tutors?subject=${encodeURIComponent(s.name)}`)}
                    className={`${s.color} rounded-xl p-6 text-center cursor-pointer hover:shadow-lg transition-all`}
                  >
                    <div className="text-3xl mb-3">{s.emoji}</div>
                    <div className="font-bold text-gray-900 mb-1">{s.name}</div>
                    <div className="text-sm text-gray-600">{count} tutors</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION — Java & OOP (IT modules) */}
        <section ref={javaSectionRef} className="py-20 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <motion.div
                variants={slideLeftVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="order-2 lg:order-1"
              >
                <img
                  src="/images/home/java-banner.jpg"
                  alt="Student coding Java on a laptop"
                  className="w-full rounded-2xl shadow-lg object-cover aspect-[12/7] border border-gray-100"
                  loading="lazy"
                />
              </motion.div>
              <motion.div
                variants={slideRightVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="order-1 lg:order-2"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-wyzant-teal mb-2">Programming · OOP</p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Master Java for your IT modules
                </h2>
                <p className="text-lg text-gray-600 mb-4 leading-relaxed">
                  Get peer support for <strong className="text-gray-800">object-oriented programming</strong>, data structures,
                  and coursework aligned with modules like <strong className="text-gray-800">IT1010</strong> and{' '}
                  <strong className="text-gray-800">IT2010</strong>. Practice with real examples and clear explanations from
                  tutors who know the curriculum.
                </p>
                <ul className="text-gray-600 space-y-2 mb-8 list-disc list-inside">
                  <li>Classes, inheritance, polymorphism, and collections</li>
                  <li>Debugging, IDEs, and assignment help</li>
                  <li>Exam prep and lab-style walkthroughs</li>
                </ul>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/tutors?subject=IT1010')}
                    className="bg-wyzant-teal text-white px-6 py-3 rounded-xl font-medium hover:bg-wyzant-teal-dark transition-colors"
                  >
                    Find Java / IT1010 tutors
                  </button>
            <button
                    type="button"
                    onClick={() => navigate('/tutors?subject=IT2010')}
                    className="border-2 border-wyzant-teal text-wyzant-teal px-6 py-3 rounded-xl font-medium hover:bg-wyzant-teal-light transition-colors"
            >
                    IT2010 tutors
            </button>
          </div>
        </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 5 - FEATURED TUTORS */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
          <motion.div
            variants={slideRightVariant}
            initial="hidden"
            whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Top Tutors</h2>
              <p className="text-xl text-gray-600">Learn from the best in their field</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tutors.slice(0, 8).map((tutor, idx) => (
                <motion.div
                  key={tutor._id}
                  variants={slideUpVariant}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 2.5, repeat: Infinity, repeatType: "reverse" }}
                  animate={{ y: [0, -10, 0] }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0px_10px_30px_rgba(0,0,0,0.06)] cursor-pointer"
                  onClick={() => navigate(`/tutor/${tutor._id}`)}
                >
                  <div className="flex items-center mb-5">
                    <img
                      src={TUTOR_AVATAR(idx)}
                      alt={tutor.fullName}
                      className="w-14 h-14 rounded-full mr-4 border-2 border-wyzant-teal/20 object-cover shadow-sm"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{tutor.fullName}</h3>
                      <div className="flex items-center text-sm">
                        <span className="text-yellow-500">★</span>
                        <span className="text-gray-600 ml-1">4.9 (127 reviews)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    {Array.isArray(tutor.subjects) ? tutor.subjects.slice(0, 2).join(', ') : 'General'}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-wyzant-teal">
                      Rs. {tutor.hourlyRate}/hr
                    </div>
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Available now
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-10">
              <button
                type="button"
                onClick={() => navigate('/tutors')}
                className="bg-wyzant-teal text-white px-8 py-3 rounded-lg font-medium hover:bg-wyzant-teal-dark transition-colors"
              >
                View All Tutors
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 6 - GUARANTEE */}
        <section className="py-20 bg-gradient-to-r from-wyzant-teal to-peerwise-navy text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
              variants={slideUpVariant}
            initial="hidden"
            whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="text-5xl mb-6">🛡️</div>
              <h2 className="text-4xl font-bold mb-4">The Right Fit, Guaranteed</h2>
              <p className="text-xl mb-8 text-white/90">
                We're so confident you'll find the perfect tutor that we guarantee your first hour session. 
                If you're not satisfied, it's free.
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/tutors')}
                  className="bg-white text-wyzant-teal px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Find Your Tutor
                </button>
              <button
                  type="button"
                  onClick={() => navigate('/', { state: { scrollAuth: 'signup' } })}
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
              >
                  Learn More
              </button>
            </div>
          </motion.div>
        </div>
        </section>

        {/* SECTION 7 - CTA */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            variants={slideLeftVariant}
            initial="hidden"
            whileInView="visible"
                viewport={{ once: true }}
                className="bg-white rounded-xl p-8 text-center"
              >
                <div className="text-4xl mb-4">👨‍🎓</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">I Want to Learn</h3>
                <p className="text-gray-600 mb-6">Get help from expert tutors in any subject</p>
                <button
                  type="button"
                  onClick={() => navigate('/tutors')}
                  className="bg-wyzant-teal text-white px-6 py-3 rounded-lg font-medium hover:bg-wyzant-teal-dark transition-colors w-full md:w-auto"
                >
                  Find a Tutor
                </button>
          </motion.div>

        <motion.div
          variants={slideRightVariant}
          initial="hidden"
          whileInView="visible"
                viewport={{ once: true }}
                className="bg-white rounded-xl p-8 text-center"
              >
                <div className="text-4xl mb-4">🧑‍🏫</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">I Want to Teach</h3>
                <p className="text-gray-600 mb-6">Share your knowledge and earn money</p>
                <button
                  type="button"
                  onClick={() => navigate('/', { state: { scrollAuth: 'signup' } })}
                  className="bg-wyzant-teal text-white px-6 py-3 rounded-lg font-medium hover:bg-wyzant-teal-dark transition-colors w-full md:w-auto"
                >
                  Become a Tutor
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 8 - FOOTER */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
                <div className="flex items-center gap-3 mb-4">
                  <img src={PEERWISE_LOGO_URL} alt="PeerWise logo" className="h-9 w-auto max-w-[180px] object-contain" />
                </div>
                <p className="text-gray-400">Learn Together, Grow Together</p>
            </div>

            <div>
                <h4 className="font-bold mb-4">For Students</h4>
                <div className="space-y-2 text-gray-400">
                  <button type="button" onClick={() => navigate('/tutors')} className="block hover:text-white">Find Tutors</button>
                  <button type="button" onClick={() => navigate('/subjects')} className="block hover:text-white">Browse Subjects</button>
                  <button type="button" onClick={() => navigate('/how-it-works')} className="block hover:text-white">How It Works</button>
            </div>
          </div>

              <div>
                <h4 className="font-bold mb-4">For Tutors</h4>
                <div className="space-y-2 text-gray-400">
                  <button type="button" onClick={() => navigate('/become-tutor')} className="block hover:text-white">Become a Tutor</button>
                  <button type="button" onClick={() => navigate('/tutor-resources')} className="block hover:text-white">Resources</button>
                  <button type="button" onClick={() => navigate('/tutor-dashboard')} className="block hover:text-white">Tutor Dashboard</button>
          </div>
              </div>
              
              <div>
                <h4 className="font-bold mb-4">Company</h4>
                <div className="space-y-2 text-gray-400">
                  <button type="button" onClick={() => navigate('/about')} className="block hover:text-white">About Us</button>
                  <button type="button" onClick={() => navigate('/contact')} className="block hover:text-white">Contact</button>
                  <button type="button" onClick={() => navigate('/privacy')} className="block hover:text-white">Privacy Policy</button>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>© 2026 PeerWise. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default Home;
