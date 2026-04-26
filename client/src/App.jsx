import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminRegister from './pages/AdminRegister';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import CustomerManager from './pages/CustomerManager';
import UserProfile from './pages/UserProfile';
import TutorListPage from './pages/TutorListPage';
import TutorProfilePage from './pages/TutorProfilePage';
import BookingForm from './pages/BookingForm';
import MyBookingsPage from './pages/MyBookingsPage';
import TutorDashboard from './pages/TutorDashboard';
import PaymentGateway from './pages/PaymentGateway';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import FeedbackChatbot from './pages/FeedbackChatbot';
import FindTutorWizard from './pages/FindTutorWizard';
import SubjectSelection from './pages/SubjectSelection';
import RequestTutorPage from './pages/RequestTutorPage';
import MeetTutorPage from './pages/MeetTutorPage';

// Navbars
import Navbar from './components/Navbar';

// Route guards
import UserRoute from './components/UserRoute';
import AdminRoute from './components/AdminRoute';

function AppContent() {
  const location = useLocation();

  // Landing and auth pages have their own custom headers or clean designs
  // Landing and auth pages have their own custom headers or clean designs
  const showGlobalNav = !['/', '/login', '/register', '/admin-register', '/find-tutor', '/subject-selection'].includes(location.pathname);

  return (
    <>
      {showGlobalNav && <Navbar />}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin-register" element={<AdminRegister />} />
        <Route path="/home" element={<UserRoute><Home /></UserRoute>} />
        <Route path="/tutors" element={<UserRoute><TutorListPage /></UserRoute>} />
        <Route path="/tutor/:id" element={<UserRoute><TutorProfilePage /></UserRoute>} />
        <Route path="/find-tutor" element={<UserRoute><FindTutorWizard /></UserRoute>} />
        <Route path="/subject-selection" element={<UserRoute><SubjectSelection /></UserRoute>} />
        <Route path="/request-tutor/:id" element={<UserRoute><RequestTutorPage /></UserRoute>} />
        <Route path="/meet-tutor" element={<UserRoute><MeetTutorPage /></UserRoute>} />
        
        <Route
          path="/booking-form/:id"
          element={
            <UserRoute>
              <BookingForm />
            </UserRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <UserRoute>
              <MyBookingsPage />
            </UserRoute>
          }
        />

        <Route path="/profile" element={<UserRoute><UserProfile /></UserRoute>} />
        <Route path="/tutor-dashboard" element={<UserRoute><TutorDashboard /></UserRoute>} />
        
        <Route
          path="/payment-gateway"
          element={
            <UserRoute>
              <PaymentGateway />
            </UserRoute>
          }
        />
        <Route
          path="/payment-history"
          element={
            <UserRoute>
              <PaymentHistoryPage />
            </UserRoute>
          }
        />
        <Route path="/feedback-chat" element={<FeedbackChatbot />} />

        <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route
          path="/student-manager"
          element={
            <AdminRoute>
              <CustomerManager />
            </AdminRoute>
          }
        />
      </Routes>

      <ToastContainer position="top-center" autoClose={1000} />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
