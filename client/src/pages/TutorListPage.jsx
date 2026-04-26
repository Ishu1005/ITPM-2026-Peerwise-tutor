import { Fragment, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/wyzant.css';

const SUBJECT_OPTIONS = [
  'Y1S1', 'Y1S2', 'Y2S1', 'Y2S2', 'Y3S1', 'Y3S2', 'Y4S1', 'Y4S2',
  'DSA', 'PAF', 'MC', 'ITPM', 'NDM', 'OOC', 'IWT', 'DBMS', 
  'SE', 'OOP', 'CDAP', 'ML', 'Other'
];

const LEVEL_OPTIONS = [
  { value: 'elementary', label: 'Elementary School' },
  { value: 'middle', label: 'Middle School' },
  { value: 'high', label: 'High School' },
  { value: 'college', label: 'College' },
  { value: 'adult', label: 'Adult Learner' },
];

function getTutorRating(tutor) {
  const ratingValue =
    typeof tutor?.rating === 'number' ? tutor.rating : typeof tutor?.averageRating === 'number' ? tutor.averageRating : 4.8;
  const ratingCount =
    typeof tutor?.ratingCount === 'number'
      ? tutor.ratingCount
      : typeof tutor?.reviewCount === 'number'
        ? tutor.reviewCount
        : typeof tutor?.reviewsCount === 'number'
          ? tutor.reviewsCount
          : 24;
  return { ratingValue, ratingCount };
}

function getInitials(name) {
  return (name || '?').trim()?.[0]?.toUpperCase() || '?';
}

function dayNameLower(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

function TutorListPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Applied filters used by API.
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [level, setLevel] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [rating, setRating] = useState(''); // '', 5, 4, 3

  // Draft filters controlled by UI.
  const [searchInput, setSearchInput] = useState('');
  const [subjectInput, setSubjectInput] = useState(''); // '' => All Subjects
  const [locationInput, setLocationInput] = useState('');
  const [levelInput, setLevelInput] = useState('');
  const [minPriceInput, setMinPriceInput] = useState(0);
  const [maxPriceInput, setMaxPriceInput] = useState(5000);
  const [ratingInput, setRatingInput] = useState(''); // '', 5, 4, 3

  // Availability is filtered client-side (API spec does not include it).
  const [availableToday, setAvailableToday] = useState(false);
  const [availableThisWeek, setAvailableThisWeek] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);

  const [sortBy, setSortBy] = useState('recommended'); // recommended | price | rating | experience

  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const pageSize = 12;

  useEffect(() => {
    const urlSubject = searchParams.get('subject') || '';
    const urlLocation = searchParams.get('location') || '';
    const urlLevel = searchParams.get('level') || '';
    const urlSearch = searchParams.get('search') || '';

    setSearchInput(urlSearch);
    setSubjectInput(urlSubject);
    setLocationInput(urlLocation);
    setLevelInput(urlLevel);
    setMinPriceInput(0);
    setMaxPriceInput(5000);
    setRatingInput('');

    setAvailableToday(false);
    setAvailableThisWeek(false);
    setOnlineOnly(false);

    // Commit applied filters so API fetch is correct on load and when URL changes.
    setSearch(urlSearch);
    setSubject(urlSubject);
    setLocation(urlLocation);
    setLevel(urlLevel);
    setMinPrice(0);
    setMaxPrice(5000);
    setRating('');
    setCurrentPage(1);
  }, [searchParams]);

  const fetchTutors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (subject) params.append('subject', subject);
      if (search) params.append('search', search);
      if (location) params.append('location', location);
      if (level) params.append('level', level);
      if (minPrice > 0) params.append('minPrice', minPrice);
      if (maxPrice < 5000) params.append('maxPrice', maxPrice);
      if (rating) params.append('rating', rating);

      const res = await axios.get(
        `http://localhost:5000/api/tutors?${params.toString()}`,
        { withCredentials: true },
      );
      setTutors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load tutors');
      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  // Keep API fetch aligned to your required dependency list.
  useEffect(() => {
    fetchTutors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, subject, location, level, minPrice, maxPrice, rating]);

  const availabilitySet = useMemo(() => {
    const today = dayNameLower(new Date());
    const next7 = new Set();
    for (let i = 0; i < 7; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      next7.add(dayNameLower(d));
    }
    return { today, next7 };
  }, []);

  const localFilteredTutors = useMemo(() => {
    const availFiltered = tutors.filter(tutor => {
      const isActive = tutor?.isActive !== false;
      const isOnline = tutor?.isOnline || false;

      // Online filter
      if (onlineOnly && !isOnline) {
        return false;
      }

      const availability = Array.isArray(tutor?.availability) ? tutor.availability : [];

      if (!availableToday && !availableThisWeek) {
        return isActive;
      }

      // If we don't have availability data, fall back to isActive to avoid hiding everything.
      if (!availability.length) {
        return isActive;
      }

      const availabilityDays = availability
        .map(a => (a?.day || '').toString().trim().toLowerCase())
        .filter(Boolean);

      const todayMatch = availabilityDays.includes(availabilitySet.today);
      const weekMatch = availabilityDays.some(d => availabilitySet.next7.has(d));

      if (availableToday && availableThisWeek) return todayMatch || weekMatch;
      if (availableToday) return todayMatch;
      if (availableThisWeek) return weekMatch;
      return isActive;
    });

    const subjectFiltered = availFiltered.filter(tutor => {
      if (!subject) return true;
      const list = Array.isArray(tutor.subjects) ? tutor.subjects : [];
      return list.includes(subject);
    });

    return subjectFiltered;
  }, [tutors, availableToday, availableThisWeek, subject, availabilitySet, onlineOnly]);

  const sortedTutors = useMemo(() => {
    const list = [...localFilteredTutors];

    if (sortBy === 'price') {
      list.sort((a, b) => (a?.hourlyRate || 0) - (b?.hourlyRate || 0));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => getTutorRating(b).ratingValue - getTutorRating(a).ratingValue);
    } else if (sortBy === 'experience') {
      list.sort((a, b) => (b?.experience || 0) - (a?.experience || 0));
    }

    return list;
  }, [localFilteredTutors, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedTutors.length / pageSize));

  const pagedTutors = useMemo(() => {
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const startIdx = (safePage - 1) * pageSize;
    return sortedTutors.slice(startIdx, startIdx + pageSize);
  }, [sortedTutors, currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, subject, location, level, minPrice, maxPrice, rating, availableToday, availableThisWeek, onlineOnly, sortBy]);

  const applyFilters = () => {
    setSearch(searchInput);
    setSubject(subjectInput);
    setLocation(locationInput);
    setLevel(levelInput);
    setMinPrice(Number(minPriceInput) || 0);
    setMaxPrice(Number(maxPriceInput) || 5000);
    setRating(ratingInput);
    setShowMobileFilters(false);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSubjectInput('');
    setLocationInput('');
    setLevelInput('');
    setMinPriceInput(0);
    setMaxPriceInput(5000);
    setRatingInput('');

    setAvailableToday(false);
    setAvailableThisWeek(false);
    setOnlineOnly(false);

    // Commit applied filters.
    setSearch('');
    setSubject('');
    setLocation('');
    setLevel('');
    setMinPrice(0);
    setMaxPrice(5000);
    setRating('');
    setCurrentPage(1);

    navigate('/tutors');
  };

  const handleSearch = e => {
    e.preventDefault();
    const next = searchInput.trim();
    navigate(`/tutors?search=${encodeURIComponent(next)}`);
  };

  const renderSkeleton = () => (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-5 w-2/5 bg-gray-200 rounded mb-3" />
          <div className="h-4 w-1/3 bg-gray-200 rounded mb-3" />
          <div className="h-4 w-4/5 bg-gray-200 rounded mb-3" />
          <div className="h-4 w-3/4 bg-gray-200 rounded mb-3" />
          <div className="h-8 w-40 bg-gray-200 rounded" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="h-9 w-28 bg-gray-200 rounded" />
          <div className="h-9 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-16">
        <div className="bg-gradient-to-r from-wyzant-teal to-peerwise-navy text-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Perfect Tutor</h1>
              <p className="text-xl text-white/90 mb-8">Browse 500+ expert tutors in every subject</p>

              <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
                <div className="bg-white rounded-xl shadow-xl p-2 flex flex-col md:flex-row gap-2">
                  <div className="flex-1 flex items-center px-4 py-3">
                    <span className="text-gray-400 mr-3">🔍</span>
                    <input
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      placeholder="What do you want to learn?"
                      className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                    />
                  </div>
                  
                  <div className="flex items-center px-4 py-3 border-l border-gray-200">
                    <span className="text-gray-400 mr-3">📍</span>
                    <input
                      value={locationInput}
                      onChange={e => setLocationInput(e.target.value)}
                      placeholder="City or online"
                      className="outline-none text-gray-700 placeholder-gray-400 w-32"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="bg-wyzant-teal text-white px-8 py-3 rounded-lg font-medium hover:bg-wyzant-teal-dark transition-colors"
                  >
                    Search Tutors
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <span>🔽</span>
                <span>Filters</span>
              </button>

              <div className="hidden lg:flex items-center gap-4">
                <select
                  value={subjectInput}
                  onChange={e => setSubjectInput(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 outline-none"
                >
                  <option value="">All Subjects</option>
                  {SUBJECT_OPTIONS.map(s => (
                    <option key={s} value={s}>
                      {s === 'Other' ? 'Other' : s}
                    </option>
                  ))}
                </select>

                <select
                  value={levelInput}
                  onChange={e => setLevelInput(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 outline-none"
                >
                  <option value="">All Levels</option>
                  {LEVEL_OPTIONS.map(l => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlineOnly}
                      onChange={e => setOnlineOnly(e.target.checked)}
                    />
                    <span className="text-sm">Online only</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availableToday}
                      onChange={e => setAvailableToday(e.target.checked)}
                    />
                    <span className="text-sm">Available today</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={applyFilters}
                  className="bg-wyzant-teal text-white px-4 py-2 rounded-lg font-medium hover:bg-wyzant-teal-dark transition-colors"
                >
                  Apply Filters
                </button>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 pb-16 pt-6">
        <div className="flex gap-8">
          {/* FILTER SIDEBAR (desktop only) */}
          <aside className={`hidden lg:block w-[280px] ${showMobileFilters ? 'block' : ''}`}>
            <div className="sticky top-24">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-gray-900 font-bold text-lg">Filters</div>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-wyzant-teal hover:text-wyzant-teal-dark text-sm font-medium"
                  >
                    Clear all
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="font-semibold text-gray-900 mb-3">Subject</div>
                    <select
                      value={subjectInput}
                      onChange={e => setSubjectInput(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    >
                      <option value="">All Subjects</option>
                      {SUBJECT_OPTIONS.map(s => (
                        <option key={s} value={s}>
                          {s === 'Other' ? 'Other' : s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="font-semibold text-gray-900 mb-3">Level</div>
                    <select
                      value={levelInput}
                      onChange={e => setLevelInput(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                    >
                      <option value="">All Levels</option>
                      {LEVEL_OPTIONS.map(l => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="font-semibold text-gray-900 mb-3">Price Range (Rs/hr)</div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">Min</div>
                        <input
                          type="number"
                          value={minPriceInput}
                          onChange={e => setMinPriceInput(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">Max</div>
                        <input
                          type="number"
                          value={maxPriceInput}
                          onChange={e => setMaxPriceInput(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold text-gray-900 mb-3">Rating</div>
                    <div className="space-y-2">
                      {[
                        { label: '⭐⭐⭐⭐⭐ 5 stars', value: '5' },
                        { label: '⭐⭐⭐⭐ 4 stars & up', value: '4' },
                        { label: '⭐⭐⭐ 3 stars & up', value: '3' },
                      ].map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="rating"
                            checked={ratingInput === opt.value}
                            onChange={() => setRatingInput(opt.value)}
                          />
                          <span className="text-gray-700">{opt.label}</span>
                        </label>
                      ))}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="rating"
                          checked={!ratingInput}
                          onChange={() => setRatingInput('')}
                        />
                        <span className="text-gray-700">Any rating</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold text-gray-900 mb-3">Availability</div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={onlineOnly} onChange={e => setOnlineOnly(e.target.checked)} />
                        <span>Online tutors only</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={availableToday} onChange={e => setAvailableToday(e.target.checked)} />
                        <span>Available today</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={availableThisWeek}
                          onChange={e => setAvailableThisWeek(e.target.checked)}
                        />
                        <span>Available this week</span>
                      </label>
                    </div>
                  </div>
                </div>

                <button type="button" onClick={applyFilters} className="w-full bg-wyzant-teal text-white py-3 rounded-lg font-semibold hover:bg-wyzant-teal-dark transition-colors mt-6">
                  Apply Filters
                </button>
              </div>
            </div>
          </aside>

          {/* TUTORS LIST */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="text-gray-600 font-semibold">
                {loading ? 'Loading tutors...' : `${localFilteredTutors.length} tutors found`}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-gray-700 font-medium">Sort by:</div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 outline-none bg-white"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price">Price: Low to High</option>
                  <option value="rating">Rating</option>
                  <option value="experience">Experience</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {renderSkeleton()}
                  </motion.div>
                ))}
              </div>
            ) : pagedTutors.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pagedTutors.map((tutor, idx) => {
                  const { ratingValue, ratingCount } = getTutorRating(tutor);
                  const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];
                  const displaySubjects = subjects.length ? subjects.slice(0, 3) : ['General'];
                  const bio = tutor?.bio || 'Passionate educator dedicated to student success.';
                  const initials = getInitials(tutor?.fullName);
                  const isAvailable = tutor?.isActive !== false;
                  const isOnline = tutor?.isOnline || false;

                  return (
                    <motion.div
                      key={tutor._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ y: -4 }}
                      className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-xl transition-all"
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white">
                              <img 
                                src={tutor?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor?.fullName)}&background=random`} 
                                alt={tutor?.fullName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {isOnline && (
                              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-lg truncate">{tutor?.fullName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center text-yellow-500 font-bold">
                                <span>⭐</span>
                                <span className="text-gray-900 ml-1">{ratingValue.toFixed(1)}</span>
                              </div>
                              <span className="text-gray-400 text-sm">({ratingCount} reviews)</span>
                              <span className="text-gray-300">|</span>
                              <span className="text-gray-500 text-xs font-semibold uppercase tracking-tighter decoration-teal-500 underline underline-offset-4">
                                Fast Response
                              </span>
                            </div>
                            <div className="text-2xl font-black text-gray-900 mt-2">
                               <span className="text-sm font-normal text-gray-400">Rs.</span>{tutor?.hourlyRate || 0}<span className="text-sm font-normal text-gray-400">/hr</span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {displaySubjects.map(s => (
                              <span key={s} className="bg-teal-50 text-teal-700 border border-teal-100 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <p
                          className="text-sm text-gray-600 mb-4 line-clamp-2"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {bio}
                        </p>

                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
                          <span className={`flex items-center gap-1 ${isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                            <span>●</span>
                            <span>{isAvailable ? 'Available' : 'Busy'}</span>
                          </span>
                          <span>📍 {tutor?.location || 'Online'}</span>
                          {tutor?.experience && (
                            <span>🎓 {tutor.experience} years exp</span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/tutor/${tutor._id}?subject=${encodeURIComponent(subject)}`)}
                            className="flex-1 border-2 border-wyzant-teal text-wyzant-teal py-3 rounded-xl font-bold hover:bg-wyzant-teal-light transition-all flex items-center justify-center gap-2"
                          >
                            View Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/booking-form/${tutor._id}?subject=${encodeURIComponent(subject)}`)}
                            className="flex-1 bg-wyzant-teal text-white py-3 rounded-xl font-bold hover:bg-wyzant-teal-dark transition-all shadow-md shadow-teal-100 flex items-center justify-center gap-2"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100">
                <div className="text-8xl mb-6">🔍</div>
                <div className="text-gray-900 font-bold text-3xl mb-4">No tutors found for "{subject}"</div>
                <div className="text-gray-600 mb-10 max-w-md text-lg">
                  Try adjusting your filters or search terms to find more tutors in this subject.
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="bg-wyzant-teal text-white px-10 py-4 rounded-xl font-bold text-xl hover:bg-wyzant-teal-dark transition-all shadow-xl shadow-teal-100"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* PAGINATION */}
            {!loading && sortedTutors.length > 0 && (
              <div className="mt-8 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    ← Previous
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    const isCurrentPage = currentPage === page;
                    const isFarPage = page > 3 && page < totalPages - 1;

                    if (isFarPage && page === 4) {
                      return <span key="dots1" className="px-2 text-gray-400">...</span>;
                    }
                    if (isFarPage && page === totalPages - 1) {
                      return (
                        <Fragment key="last-pages">
                          <button
                            type="button"
                            onClick={() => setCurrentPage(totalPages)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              currentPage === totalPages
                                ? 'bg-wyzant-teal text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {totalPages}
                          </button>
                        </Fragment>
                      );
                    }

                    if (isFarPage) return null;

                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        disabled={page > totalPages}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          isCurrentPage
                            ? 'bg-wyzant-teal text-white'
                            : page > totalPages
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage >= totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorListPage;

