import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { PEERWISE_LOGO_URL } from '../constants/brand';

function NavbarPublic() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/auth/session', { withCredentials: true })
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:5000/api/auth/logout', { withCredentials: true });
      toast.success('Logged out successfully');
      navigate('/');
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-md border-b border-[#E0E0E0]">
      <div className="flex items-center space-x-4">
        <Link to="/home" className="flex items-center gap-2">
          <img src={PEERWISE_LOGO_URL} alt="PeerWise" className="h-10 sm:h-11 w-auto max-w-[200px] object-contain" />
        </Link>
      </div>

      <div className="hidden md:flex items-center space-x-6 text-[#2C3E50] font-semibold">
        <Link to="/home" className="hover:text-wyzant-teal transition-colors">
          Home
        </Link>
        <Link to="/tutors" className="hover:text-wyzant-teal transition-colors">
          Tutors
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <span className="text-[#2C3E50] font-semibold">{user.username}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="bg-wyzant-teal hover:bg-wyzant-teal-dark text-white py-2 px-5 rounded-lg shadow transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/"
            className="bg-wyzant-teal hover:bg-wyzant-teal-dark text-white py-2 px-5 rounded-lg shadow transition-colors"
          >
            Log In
          </Link>
        )}
      </div>
    </nav>
  );
}

export default NavbarPublic;
