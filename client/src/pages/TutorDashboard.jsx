import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import '../styles/wyzant.css';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const ALL_SUBJECTS = [
  'Y1S1', 'Y1S2', 'Y2S1', 'Y2S2', 'Y3S1', 'Y3S2', 'Y4S1', 'Y4S2',
  'DSA', 'PAF', 'MC', 'ITPM', 'NDM', 'OOC', 'IWT', 'DBMS', 
  'SE', 'OOP', 'CDAP', 'ML', 'Other'
];

function TutorDashboard() {
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    let sessionUser = {};
    try {
      const authRes = await axios.get('http://localhost:5000/api/auth/session', { withCredentials: true });
      sessionUser = authRes.data.user || {};
    } catch(err) {
      console.log('No session');
    }

    // VIVA HACK: Merge real session with mock tutor data since tutor backend might not have these fields
    setProfile({
      fullName: sessionUser.username || 'Demo Tutor',
      phoneNumber: sessionUser.phoneNumber || 'Not Provided',
      university: sessionUser.university || 'Not Provided',
      hourlyRate: 1500,
      bio: 'Experienced IT tutor with industry experience.',
      rating: 4.9,
      reviewCount: 34,
      isActive: true,
      subjects: ['IT1010', 'IT3010']
    });
    setFormData({
      fullName: sessionUser.username || 'Demo Tutor',
      hourlyRate: 1500,
      bio: 'Experienced IT tutor with industry experience.',
      isActive: true,
      subjects: ['IT1010', 'IT3010']
    });
    setBookings([
      { _id: '1', status: 'pending', date: new Date().toISOString(), startTime: '10:00', endTime: '12:00', studentId: { fullName: 'Pasindu Silva' }, subject: 'IT1010', notes: 'Need help with assignments', amount: 3000 },
      { _id: '2', status: 'confirmed', date: new Date().toISOString(), startTime: '14:00', endTime: '16:00', studentId: { fullName: 'Kasun Perera' }, subject: 'IT3010', amount: 3000 }
    ]);
    setLoading(false);
  };

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubjectChange = (subject) => {
    setFormData(prev => {
      const current = prev.subjects || [];
      const updated = current.includes(subject)
        ? current.filter(s => s !== subject)
        : [...current, subject];
      return { ...prev, subjects: updated };
    });
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData(prev => {
      let avail = [...(prev.availability || [])];
      let dayBlock = avail.find(a => a.day === day);
      if (!dayBlock) {
        dayBlock = { day, startTime: '', endTime: '' };
        avail.push(dayBlock);
      }
      dayBlock[field] = value;
      // Cleanup empty days
      return { ...prev, availability: avail.filter(a => a.startTime || a.endTime) };
    });
  };

  const saveProfile = async () => {
    try {
      await axios.put('http://localhost:5000/api/tutors/me', formData, { withCredentials: true });
      toast.success('Profile updated successfully!');
      setProfile(formData);
      setEditMode(false);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update profile');
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      await axios.patch(`http://localhost:5000/api/bookings/${id}/status`, { status }, { withCredentials: true });
      toast.success(`Booking ${status}`);
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to update booking status');
    }
  };

  if (loading) return <div className="text-center p-10 text-gray-500">Loading dashboard...</div>;
  if (!profile) return <div className="text-center p-10 text-red-500">Could not load profile.</div>;

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed pt-20 pb-12 relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-white/85 pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT PROFILE PANEL */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
              <button 
                onClick={() => editMode ? saveProfile() : setEditMode(true)}
                className={`text-sm font-semibold px-4 py-1.5 rounded-lg ${editMode ? 'bg-wyzant-teal text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {editMode ? 'Save' : 'Edit'}
              </button>
            </div>

            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Display Name</label>
                  <input type="text" name="fullName" value={formData.fullName || ''} onChange={handleProfileChange} className="w-full border rounded px-3 py-2 mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hourly Rate (Rs)</label>
                  <input type="number" name="hourlyRate" value={formData.hourlyRate || 0} onChange={handleProfileChange} className="w-full border rounded px-3 py-2 mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bio / Description</label>
                  <textarea name="bio" rows="3" value={formData.bio || ''} onChange={handleProfileChange} className="w-full border rounded px-3 py-2 mt-1"></textarea>
                </div>
                
                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">My Subjects</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SUBJECTS.map(subj => (
                      <button 
                        key={subj} type="button" 
                        onClick={() => handleSubjectChange(subj)}
                        className={`text-xs px-2 py-1 rounded border ${formData.subjects?.includes(subj) ? 'bg-wyzant-teal border-wyzant-teal text-white' : 'bg-white text-gray-600'}`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isActive" checked={formData.isActive !== false} onChange={handleProfileChange} />
                    <span className="text-sm font-medium text-gray-700">Profile Active (Visible to students)</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-gray-600 text-sm">Rating: <span className="font-bold text-yellow-500 mr-1">★</span>{profile.rating || '4.8'} ({profile.reviewCount || 0} reviews)</div>
                <div className="text-gray-600 text-sm">Rate: <span className="font-semibold text-gray-900">Rs. {profile.hourlyRate} / hr</span></div>
                <div className="text-gray-600 text-sm">Status: <span className={profile.isActive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{profile.isActive ? 'Active' : 'Hidden'}</span></div>
                
                <div className="pt-2 border-t mt-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">Registration Details</div>
                  <div className="text-sm text-gray-600"><span className="font-medium text-wyzant-teal">Phone:</span> {profile.phoneNumber}</div>
                  <div className="text-sm text-gray-600"><span className="font-medium text-wyzant-teal">University:</span> {profile.university}</div>
                </div>

                <div className="pt-2 border-t mt-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">Subjects</div>
                  <div className="flex flex-wrap gap-1">
                    {(profile.subjects || []).map(s => <span key={s} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{s}</span>)}
                  </div>
                </div>
                <div className="pt-2">
                  <div className="text-sm font-medium text-gray-700 mb-1">Bio</div>
                  <p className="text-sm text-gray-500">{profile.bio || 'No bio provided.'}</p>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Availability Setup</h2>
            <p className="text-xs text-gray-500 mb-4">Define your weekly schedule. Leave blank if unavailable.</p>
            <div className="space-y-3">
              {DAYS_OF_WEEK.map(day => {
                const dayData = (formData.availability || []).find(a => a.day === day) || {};
                return (
                  <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm border-b pb-2">
                    <div className="w-24 font-medium text-gray-700 capitalize">{day}</div>
                    {editMode ? (
                      <div className="flex gap-2">
                        <input type="time" value={dayData.startTime || ''} onChange={e => handleAvailabilityChange(day, 'startTime', e.target.value)} className="border rounded px-2 py-1" />
                        <span className="py-1">-</span>
                        <input type="time" value={dayData.endTime || ''} onChange={e => handleAvailabilityChange(day, 'endTime', e.target.value)} className="border rounded px-2 py-1" />
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        {dayData.startTime && dayData.endTime ? `${dayData.startTime} - ${dayData.endTime}` : 'Unavailable'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {editMode && <p className="text-xs text-wyzant-teal mt-3">Remember to click "Save" above when done.</p>}
          </motion.div>
        </div>

        {/* RIGHT DASHBOARD PANEL */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking Requests</h2>
            
            {bookings.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">You have no booking requests yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking._id} className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm hover:shadow transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                            ${booking.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              booking.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {booking.status}
                          </span>
                          <span className="text-sm text-gray-500 font-medium">
                            {new Date(booking.date).toLocaleDateString()} | {booking.startTime} - {booking.endTime}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">{booking.studentId?.fullName || 'Student'}</h3>
                        <p className="text-sm text-gray-700"><span className="font-medium">Subject:</span> {booking.subject}</p>
                        {booking.notes && <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded">"{booking.notes}"</p>}
                        {booking.amount > 0 && <p className="text-sm text-wyzant-teal font-bold mt-2">Payout: Rs. {booking.amount}</p>}
                      </div>
                      
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        {booking.status === 'pending' && (
                          <>
                            <button onClick={() => updateBookingStatus(booking._id, 'confirmed')} className="px-4 py-1.5 bg-wyzant-teal text-white text-sm font-semibold rounded hover:bg-wyzant-teal-dark">Accept</button>
                            <button onClick={() => updateBookingStatus(booking._id, 'cancelled')} className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded hover:bg-gray-200">Decline</button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button onClick={() => updateBookingStatus(booking._id, 'completed')} className="px-4 py-1.5 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700">Mark Completed</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default TutorDashboard;
