import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function UserProfile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/auth/session', { withCredentials: true })
      .then(res => {
        console.log(res.data);  // Debugging: log the response
        setUser(res.data.user); // Ensure the 'user' field is correctly set
      })
      .catch(() => {
        toast.error('Session expired. Please log in again.');
        navigate('/');
      });
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:5000/api/auth/logout', { withCredentials: true });
      toast.success('Logged out successfully!');
      window.location.href = '/';
    } catch (err) {
      toast.error('Logout failed. Please try again.');
    }
  };

  const handleAdminDashboard = () => {
    navigate('/admin-dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cinnamon-bg font-sans">
      {user ? (
        <div className="bg-[#fffaf2cc] p-8 rounded-2xl shadow-lg text-center max-w-3xl w-full border border-cinnamon-light">
          {/* Profile Header */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-cinnamon-light flex items-center justify-center text-white font-semibold text-xl">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="ml-4">
              <h2 className="text-3xl font-bold text-cinnamon">{user.username}</h2>
              <p className="text-cinnamon text-lg">{user.role === 'admin' ? 'Administrator' : 'Regular User'}</p>
            </div>
          </div>

          {/* User Info Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-lg border border-cinnamon-light">
              <h3 className="text-xl font-semibold text-cinnamon mb-4">Personal Information</h3>
              <p className="text-cinnamon text-sm mb-2"><strong>Username:</strong> {user.username}</p>
              <p className="text-cinnamon text-sm mb-2"><strong>Email:</strong> {user.email}</p> {/* Ensure email is displayed */}
              <p className="text-cinnamon text-sm mb-2"><strong>Phone Number:</strong> {user.phoneNumber || 'Not Provided'}</p>
              <p className="text-cinnamon text-sm mb-2"><strong>University/Institution:</strong> {user.university || 'Not Provided'}</p>
              <p className="text-cinnamon text-sm"><strong>Role:</strong> {user.role === 'admin' ? 'Administrator' : 'Regular User'}</p>
            </div>

            {/* Admin Actions Section */}
            {user.role === 'admin' && (
              <div className="bg-white p-6 rounded-lg shadow-lg border border-cinnamon-light">
                <h3 className="text-xl font-semibold text-cinnamon mb-4">Admin Actions</h3>
                <p className="text-cinnamon text-sm mb-2">As an admin, you have special access to manage the platform.</p>
                <button
                  onClick={handleAdminDashboard}
                  className="w-full py-3 bg-cinnamon text-white rounded-lg shadow-md hover:bg-cinnamon-hover transition duration-300 mb-4"
                >
                  Go to Admin Dashboard
                </button>
              </div>
            )}

            {/* Regular User Section */}
            {user.role === 'user' && (
              <div className="bg-white p-6 rounded-lg shadow-lg border border-cinnamon-light">
                <h3 className="text-xl font-semibold text-cinnamon mb-4">User Actions</h3>
                <p className="text-cinnamon text-sm mb-2">As a regular user, you can manage your profile and preferences.</p>
                <p className="text-cinnamon text-sm mb-2">Feel free to explore your personalized dashboard.</p>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <p className="text-white text-lg">Loading...</p>
      )}
    </div>
  );
}

export default UserProfile;
