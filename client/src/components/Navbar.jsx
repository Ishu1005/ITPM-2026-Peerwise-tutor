import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { PEERWISE_LOGO_URL } from '../constants/brand';

function Navbar() {
  const [user, setUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/auth/session', { withCredentials: true })
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null));

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:5000/api/auth/logout', { withCredentials: true });
      toast.success('Logged out successfully');
      setUser(null);
      navigate('/');
    } catch {
      toast.error('Logout failed');
    }
  };



  const NavLink = ({ to, children }) => {
    const isActive = location.pathname.startsWith(to) && to !== '/home' || (to === '/home' && location.pathname === '/home');
    return (
      <Link 
        to={to} 
        className={`relative px-1 py-2 text-sm font-semibold transition-colors duration-200 ${
          isActive ? 'text-wyzant-teal' : 'text-gray-700 hover:text-wyzant-teal'
        }`}
      >
        {children}
        {isActive && (
          <motion.div 
            layoutId="nav-underline"
            className="absolute left-0 right-0 bottom-[-4px] h-[3px] bg-wyzant-teal rounded-t-sm"
          />
        )}
      </Link>
    );
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md py-3' : 'bg-white/95 backdrop-blur-md border-b border-gray-200 py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo Section */}
        <div className="flex items-center space-x-8">
          <Link to="/home" className="flex items-center gap-2 group">
            <img
              src={PEERWISE_LOGO_URL}
              alt="PeerWise"
              className="h-9 sm:h-10 w-auto max-h-10 object-contain object-left"
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLink to="/find-tutor">Find Tutors</NavLink>
            <NavLink to="/feedback-chat">Feedback AI</NavLink>
            {user?.role === 'student' && <NavLink to="/payment-gateway">Pay Module</NavLink>}
            {user?.role === 'student' && <NavLink to="/payment-history">Payment History</NavLink>}
            {(user?.role === 'student' || user?.role === 'tutor') && <NavLink to="/my-bookings">My Bookings</NavLink>}
            {user?.role === 'tutor' && <NavLink to="/tutor-dashboard">Tutor Dashboard</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin-dashboard">Admin Panel</NavLink>}
            {user?.role === 'admin' && <NavLink to="/payment-gateway">Verify Payments</NavLink>}
          </div>
        </div>

        {/* User Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-5">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-wyzant-teal transition-colors"
                title="View Profile"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
                  user.role === 'admin' ? 'bg-purple-600' : user.role === 'tutor' ? 'bg-blue-600' : 'bg-gradient-to-tr from-wyzant-teal to-teal-200'
                }`}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span>{user.username}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full uppercase ml-1">{user.role}</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors px-2"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/', { state: { scrollAuth: 'login' } })}
                className="text-sm font-bold text-gray-700 hover:text-wyzant-teal px-3 py-2 transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => navigate('/', { state: { scrollAuth: 'signup' } })}
                className="bg-wyzant-teal hover:bg-wyzant-teal-dark text-white text-sm font-bold py-2 px-5 rounded-lg shadow-sm hover:shadow-md transition-all transform hover:-translate-y-[1px]"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-700 p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white"
          >
            <div className="px-4 py-3 space-y-1">
              <Link to="/find-tutor" className="block px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-50 hover:text-wyzant-teal">Find Tutors</Link>
              <Link to="/my-bookings" className="block px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-50 hover:text-wyzant-teal">My Bookings</Link>
              <Link to="/tutor-dashboard" className="block px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-50 hover:text-wyzant-teal">Tutor Dashboard</Link>
              <Link to="/admin-dashboard" className="block px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-50 hover:text-wyzant-teal">Admin Panel</Link>
              <Link to="/payment-gateway" className="block px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-50 hover:text-wyzant-teal">Payments</Link>
              <Link to="/payment-history" className="block px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-50 hover:text-wyzant-teal">Payment History</Link>
              <Link to="/feedback-chat" className="block px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-50 hover:text-wyzant-teal">Feedback AI</Link>
              {user ? (
                <>
                  <Link to="/profile" className="block px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-50 hover:text-wyzant-teal">Profile ({user.username})</Link>
                  <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-md font-medium text-red-600 hover:bg-red-50">Log Out</button>
                </>
              ) : (
                <div className="pt-4 pb-2 border-t border-gray-100 flex flex-col gap-2">
                  <button onClick={() => navigate('/', { state: { scrollAuth: 'login' } })} className="w-full text-center font-bold text-gray-700 bg-gray-100 py-2 rounded-lg">Log In</button>
                  <button onClick={() => navigate('/', { state: { scrollAuth: 'signup' } })} className="w-full text-center font-bold text-white bg-wyzant-teal py-2 rounded-lg">Sign Up</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;