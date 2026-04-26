import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PEERWISE_LOGO_URL } from '../constants/brand';
import '../styles/wyzant.css';

function initials(name) {
  return (name || '?').trim()?.[0]?.toUpperCase() || '?';
}

function stars(rating) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  const full = Math.round(value);
  return '★★★★★'.slice(0, full).padEnd(5, '☆');
}

function formatTime(t) {
  return t || '-';
}

function TutorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tutor, setTutor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios
      .get(`http://localhost:5000/api/tutors/${id}`, { withCredentials: true })
      .then(res => {
        if (!mounted) return;
        setTutor(res.data);
      })
      .catch(err => {
        const msg = err.response?.data?.msg || 'Failed to load tutor profile';
        toast.error(msg);
        setTutor(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    setReviewsLoading(true);
    axios
      .get(`http://localhost:5000/api/reviews/tutor/${id}`, { withCredentials: true })
      .then(res => {
        if (!mounted) return;
        setReviews(Array.isArray(res.data) ? res.data : res.data?.reviews || []);
      })
      .catch(() => {
        // Reviews API might not exist yet; keep the page usable.
        setReviews([]);
      })
      .finally(() => {
        if (!mounted) return;
        setReviewsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const computed = useMemo(() => {
    const name = tutor?.fullName || 'Tutor';
    const avatarLetter = initials(name);
    const hourlyRate = tutor?.hourlyRate ?? 0;
    const isActive = tutor?.isActive !== false;
    const subjectList = Array.isArray(tutor?.subjects) ? tutor.subjects : [];
    const availability = Array.isArray(tutor?.availability) ? tutor.availability : [];

    const avgRating =
      typeof tutor?.averageRating === 'number'
        ? tutor.averageRating
        : typeof tutor?.rating === 'number'
          ? tutor.rating
          : reviews.length
            ? reviews.reduce((sum, r) => sum + (Number(r?.rating) || 0), 0) / Math.max(1, reviews.length)
            : 4.8;

    const totalReviews =
      typeof tutor?.reviewCount === 'number'
        ? tutor.reviewCount
        : typeof tutor?.ratingCount === 'number'
          ? tutor.ratingCount
          : reviews.length || 24;

    return { name, avatarLetter, hourlyRate, isActive, subjectList, availability, avgRating, totalReviews };
  }, [tutor, reviews]);

  const Skeleton = ({ className }) => <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 h-16">
        <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={PEERWISE_LOGO_URL} alt="PeerWise logo" className="h-9 w-auto max-w-[180px] object-contain" />
            <span className="text-2xl font-bold text-wyzant-teal">PeerWise</span>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-gray-700 font-medium">
            <button
              type="button"
              onClick={() => navigate('/tutors')}
              className="hover:text-wyzant-teal transition-colors"
            >
              Find Tutors
            </button>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="hover:text-wyzant-teal transition-colors"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="hover:text-wyzant-teal transition-colors"
            >
              Subjects
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg text-wyzant-teal font-medium hover:bg-wyzant-teal-light transition-colors"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg bg-wyzant-teal text-white font-medium hover:bg-wyzant-teal-dark transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* BACK BUTTON */}
      <div className="pt-20 max-w-7xl mx-auto px-6">
        <button
          type="button"
          onClick={() => navigate('/tutors')}
          className="text-wyzant-teal font-semibold hover:underline flex items-center gap-2"
        >
          ← Back to Tutors
        </button>
      </div>

      {/* HERO */}
      <section className="mt-4 bg-gradient-to-r from-wyzant-teal to-peerwise-navy text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {loading ? (
            <div className="text-center">
              <div className="w-32 h-32 bg-white/20 rounded-full mx-auto mb-6 animate-pulse" />
              <div className="h-8 bg-white/20 rounded w-48 mx-auto mb-3 animate-pulse" />
              <div className="h-6 bg-white/20 rounded w-32 mx-auto animate-pulse" />
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="relative inline-block mb-6">
                <div className="w-40 h-40 rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
                   <img 
                    src={tutor?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(computed.name)}&background=random`} 
                    alt={computed.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {computed.isActive && (
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 border-4 border-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl font-bold">✓</span>
                  </div>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{computed.name}</h1>
              <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
                <span className="bg-white/20 text-white px-4 py-2 rounded-full font-semibold">
                  {computed.isActive ? '✅ Available' : '❌ Unavailable'}
                </span>
                <span className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-full font-bold text-lg">
                  Rs. {computed.hourlyRate}/hr
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-300 text-2xl">⭐</span>
                  <span className="text-xl font-semibold">{Number(computed.avgRating).toFixed(1)}</span>
                  <span className="text-white/80">({computed.totalReviews} reviews)</span>
                </div>
              </div>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Professional tutor specializing in {computed.subjectList.length ? computed.subjectList.join(', ') : 'multiple subjects'}
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Me */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Me</h2>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-9/12" />
                </div>
              ) : (
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {tutor?.bio || 'Passionate educator dedicated to helping students achieve their academic goals. With years of experience and a personalized approach, I strive to make learning engaging and effective.'}
                  </p>
                  {tutor?.experience && (
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-2xl">🎓</span>
                      <span className="text-gray-700 font-medium">{tutor.experience} years of experience</span>
                    </div>
                  )}
                  {tutor?.education && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-2xl">📚</span>
                      <span className="text-gray-700 font-medium">{tutor.education}</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Subjects */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Subjects I Teach</h2>
              {loading ? (
                <div className="flex flex-wrap gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-32 rounded-full" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {(computed.subjectList.length ? computed.subjectList : ['General']).map(s => (
                    <span
                      key={s}
                      className="bg-wyzant-teal-light text-teal-900 border border-teal-200 rounded-full px-4 py-2 text-sm font-semibold hover:bg-teal-100 transition-colors"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Availability */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Availability</h2>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(computed.availability.length
                      ? computed.availability
                      : [
                          { day: 'Monday', startTime: '9:00 AM', endTime: '5:00 PM' },
                          { day: 'Tuesday', startTime: '9:00 AM', endTime: '5:00 PM' },
                          { day: 'Wednesday', startTime: '9:00 AM', endTime: '5:00 PM' },
                          { day: 'Thursday', startTime: '9:00 AM', endTime: '5:00 PM' },
                          { day: 'Friday', startTime: '9:00 AM', endTime: '5:00 PM' },
                        ]).map((slot, idx) => (
                        <div key={`${slot.day}-${idx}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="font-semibold text-gray-900">{slot.day || '-'}</span>
                          </div>
                          <div className="text-gray-700">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Reviews */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Student Reviews</h2>
                {!loading && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500 text-2xl">⭐</span>
                      <span className="text-xl font-bold text-gray-900">{Number(computed.avgRating).toFixed(1)}</span>
                    </div>
                    <span className="text-gray-600">({computed.totalReviews} reviews)</span>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 border-b border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <Skeleton className="h-5 w-40" />
                      </div>
                      <Skeleton className="h-4 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  ))}
                </div>
              ) : reviews.length ? (
                <div className="space-y-4">
                  {reviews.map((r, idx) => {
                    const studentName = r?.studentName || r?.user?.username || `Student ${idx + 1}`;
                    const date = r?.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
                    const ratingValue = Number(r?.rating) || 5;
                    const comment = r?.comment || r?.text || 'Great session!';
                    const avatar = initials(studentName);
                    return (
                      <motion.div 
                        key={r?._id || idx} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 border-b border-gray-200 last:border-b-0"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-wyzant-teal-light text-wyzant-teal rounded-full flex items-center justify-center font-bold">
                              {avatar}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{studentName}</div>
                              <div className="text-sm text-gray-500">{date}</div>
                            </div>
                          </div>
                          <div className="text-yellow-500 font-semibold">{stars(ratingValue)}</div>
                        </div>
                        <p className="mt-3 text-gray-700 leading-relaxed">{comment}</p>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">⭐</div>
                  <p className="text-gray-600">No reviews yet. Be the first to leave a review!</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* RIGHT COLUMN - BOOKING CARD */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:sticky lg:top-24"
            >
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-9/12" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-wyzant-teal mb-2">Rs. {computed.hourlyRate}/hr</div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-yellow-500 text-xl">⭐</span>
                        <span className="text-gray-900 font-semibold">{Number(computed.avgRating).toFixed(1)}</span>
                        <span className="text-gray-600">({computed.totalReviews} reviews)</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📍</span>
                        <div>
                          <div className="text-sm text-gray-500">Location</div>
                          <div className="font-medium text-gray-900">{tutor?.location || 'Online'}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📧</span>
                        <div>
                          <div className="text-sm text-gray-500">Email</div>
                          <div className="font-medium text-gray-900">{tutor?.email || 'Contact for info'}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📚</span>
                        <div>
                          <div className="text-sm text-gray-500">Subjects</div>
                          <div className="font-medium text-gray-900">
                            {(computed.subjectList.length ? computed.subjectList.slice(0, 2).join(', ') : 'General')}
                            {computed.subjectList.length > 2 && ` +${computed.subjectList.length - 2} more`}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6 mt-6 space-y-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/booking-form/${tutor._id}?subject=${encodeURIComponent(computed.subjectList[0] || 'General')}`)}
                        className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
                      >
                        Book & Pay Now
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/request-tutor/${tutor._id}?subject=${encodeURIComponent(computed.subjectList[0] || 'General')}`)}
                        className="w-full border-2 border-wyzant-teal text-wyzant-teal py-4 rounded-xl font-bold text-lg hover:bg-wyzant-teal-light transition-all flex items-center justify-center gap-2"
                      >
                        Request This Tutor
                      </button>
                    </div>

                    <div className="bg-gradient-to-r from-wyzant-teal-light to-teal-50 rounded-xl p-4 mt-6 text-center border border-teal-200">
                      <div className="text-3xl mb-2">🛡️</div>
                      <div className="font-bold text-gray-900 mb-1">Satisfaction Guaranteed</div>
                      <div className="text-sm text-gray-600">Love your first session or it's free!</div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorProfilePage;

