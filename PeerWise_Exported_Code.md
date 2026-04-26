# PeerWise Full Updated Code Files


## server/models/Booking.js

``javascript

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', required: true },
  subject: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  notes: String,
  amount: { type: Number, default: 0 },
  transactionId: { type: String },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);


``


## server/models/Transaction.js

``javascript

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
  paymentMethod: { type: String, default: 'mock_card' },
  receiptUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);


``


## server/utils/emailService.js

``javascript

const nodemailer = require('nodemailer');

let testAccount = null;
let transporter = null;

// Initialize an ethereal transporter or use a real one if env vars exist
async function initTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate test Ethereal account
    testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('âœ‰ï¸ Initialized Ethereal Email Transporter for development.');
    console.log(`Credentials: ${testAccount.user} / ${testAccount.pass}`);
  }
  return transporter;
}

exports.sendBookingEmailToTutor = async (tutorEmail, studentName, date, time) => {
  try {
    const tp = await initTransporter();
    const info = await tp.sendMail({
      from: '"PeerWise System" <no-reply@peerwise.local>',
      to: tutorEmail,
      subject: 'ðŸ“… New Booking Request Received!',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>New Booking Request</h2>
          <p>Hello! You have received a new booking request from <strong>${studentName}</strong>.</p>
          <p><strong>Date:</strong> ${new Date(date).toDateString()}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p>Please log in to your dashboard to confirm or reject this booking.</p>
          <br/>
          <p>Thanks,<br/>The PeerWise Team</p>
        </div>
      `,
    });
    console.log('âœ… Email sent to Tutor: %s', info.messageId);
    if (testAccount) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Failed to send email to tutor:', error);
  }
};

exports.sendConfirmationToStudent = async (studentEmail, tutorName, date, time) => {
  try {
    const tp = await initTransporter();
    const info = await tp.sendMail({
      from: '"PeerWise System" <no-reply@peerwise.local>',
      to: studentEmail,
      subject: 'âœ… Your Session is Confirmed!',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Session Confirmed</h2>
          <p>Great news! Your booking with <strong>${tutorName}</strong> has been confirmed.</p>
          <p><strong>Date:</strong> ${new Date(date).toDateString()}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p>Get ready for an awesome learning experience.</p>
          <br/>
          <p>Thanks,<br/>The PeerWise Team</p>
        </div>
      `,
    });
    console.log('âœ… Email sent to Student: %s', info.messageId);
    if (testAccount) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Failed to send email to student:', error);
  }
};


``


## server/controllers/bookingController.js

``javascript

const Booking = require('../models/Booking');
const Student = require('../models/Student');
const User = require('../models/User');
const Tutor = require('../models/Tutor');
const Transaction = require('../models/Transaction');
const emailService = require('../utils/emailService');
const { parse, isBefore, isToday, startOfDay, addMinutes } = require('date-fns');

async function ensureStudent(userId) {
  let student = await Student.findOne({ userId });
  if (!student) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    student = await Student.create({
      userId,
      email: user.email,
      fullName: user.username
    });
  }
  return student;
}

async function canAccessBooking(user, booking) {
  if (user.role === 'admin') return true;
  const student = await Student.findById(booking.studentId);
  return (student && student.userId.toString() === user.id) || (booking.tutorId.toString() === user.id);
}

exports.createBooking = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const student = await ensureStudent(userId);
    const { tutorId, subject, date, startTime, endTime, notes, status, paymentMethod } = req.body;

    // Backend Validation
    if (!tutorId || !date || !startTime || !endTime) {
      return res.status(400).json({ msg: 'Missing required booking fields.' });
    }

    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);
    const today = startOfDay(new Date());

    if (isBefore(bookingDate, today)) {
      return res.status(400).json({ msg: 'Cannot book in the past.' });
    }

    if (isToday(bookingDate)) {
      const parsedStart = parse(startTime, 'HH:mm', bookingDate);
      if (isBefore(parsedStart, new Date())) {
        return res.status(400).json({ msg: 'Cannot book past hours for today.' });
      }
    }

    const startTotalMins = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const endTotalMins = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    if (endTotalMins <= startTotalMins) {
      return res.status(400).json({ msg: 'End time must be after start time.' });
    }

    // Double Booking Prevention
    const overlapping = await Booking.findOne({
      tutorId,
      date: bookingDate,
      status: { $ne: 'cancelled' },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({ msg: 'This time slot is no longer available. Please select another time.' });
    }

    const tutor = await Tutor.findById(tutorId).populate('userId');
    if (!tutor) {
      return res.status(404).json({ msg: 'Tutor not found.' });
    }

    const durationHours = (endTotalMins - startTotalMins) / 60;
    const amount = durationHours * (tutor.hourlyRate || 0);

    const newBooking = new Booking({
      studentId: student._id,
      tutorId,
      subject,
      date: bookingDate,
      startTime,
      endTime,
      notes,
      amount,
      status: status || 'pending',
      createdBy: userId
    });
    await newBooking.save();

    // Payment Mock: Create secure Transaction record
    let transactionRecord;
    if (amount > 0) {
      transactionRecord = new Transaction({
        bookingId: newBooking._id,
        userId: userId,
        amount: amount,
        status: 'success',
        paymentMethod: paymentMethod || 'mock_card',
        receiptUrl: `mock-receipt-${Date.now()}`
      });
      await transactionRecord.save();
      newBooking.transactionId = transactionRecord._id.toString();
      await newBooking.save();
    }

    // Trigger Email to Tutor
    if (tutor.email) {
      // Async so it doesn't block response
      emailService.sendBookingEmailToTutor(tutor.email, student.fullName, bookingDate, `${startTime} - ${endTime}`).catch(console.error);
    }

    const populated = await Booking.findById(newBooking._id).populate('tutorId').lean();
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBookingsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const sessionUser = req.session.user;
    if (sessionUser.role !== 'admin' && sessionUser.id !== userId) {
      return res.status(403).json({ msg: 'Forbidden' });
    }
    const student = await Student.findOne({ userId });
    
    // Also check if they are a tutor
    const tutor = await Tutor.findOne({ userId });

    let studentBookings = [];
    let tutorBookings = [];

    if (student) {
      studentBookings = await Booking.find({ studentId: student._id })
        .populate('tutorId')
        .sort({ date: -1 })
        .lean();
    }
    
    if (tutor) {
      // If user is a tutor, fetch bookings where they are the tutor
      const sb = await Booking.find({ tutorId: tutor._id })
        .populate('studentId')
        .sort({ date: -1 })
        .lean();
      
      // Normalize 'tutorId' population to match UI expectations but we attach student info
      sb.forEach(b => {
        b.isTutorView = true;
      });
      tutorBookings = sb;
    }

    // Combine and sort by date desc
    const all = [...studentBookings, ...tutorBookings].sort((a,b) => b.date - a.date);
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const user = req.session.user;
    if (user.role === 'admin') {
      const bookings = await Booking.find({})
        .populate('tutorId')
        .populate('studentId')
        .sort({ date: -1 })
        .lean();
      return res.json(bookings);
    }
    res.status(403).json({ msg: 'Forbidden' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    if (!(await canAccessBooking(req.session.user, booking))) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    const payload = { ...req.body };
    if (payload.date) {
      payload.date = new Date(payload.date);
      payload.date.setHours(0,0,0,0);
    }

    const updated = await Booking.findByIdAndUpdate(req.params.id, payload, { new: true })
      .populate('tutorId')
      .lean();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('studentId').populate('tutorId');
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    if (!(await canAccessBooking(req.session.user, booking))) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    const { status } = req.body;
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }

    const oldStatus = booking.status;
    booking.status = status;
    await booking.save();

    // Trigger 'Confirmed' email to Student
    if (oldStatus === 'pending' && status === 'confirmed') {
      emailService.sendConfirmationToStudent(
        booking.studentId.email,
        booking.tutorId.fullName,
        booking.date,
        `${booking.startTime} - ${booking.endTime}`
      ).catch(console.error);
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    if (!(await canAccessBooking(req.session.user, booking))) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    await booking.deleteOne();
    res.json({ msg: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


``


## server/controllers/tutorController.js

``javascript

const Tutor = require('../models/Tutor');
const Booking = require('../models/Booking');
const { startOfDay, endOfDay } = require('date-fns');

// Helper to ensure a tutor record exists for a user
async function ensureTutor(user) {
  let tutor = await Tutor.findOne({ userId: user.id });
  if (!tutor && user.role === 'tutor') {
    tutor = new Tutor({
      userId: user.id,
      fullName: user.username,
      email: user.email,
      hourlyRate: 0,
      createdBy: user.id
    });
    await tutor.save();
  }
  return tutor;
}

exports.getMyProfile = async (req, res) => {
  try {
    const user = req.session.user;
    if (user.role !== 'tutor') return res.status(403).json({ msg: 'Not a tutor' });
    
    const tutor = await ensureTutor(user);
    res.json(tutor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const user = req.session.user;
    if (user.role !== 'tutor') return res.status(403).json({ msg: 'Not a tutor' });

    let tutor = await ensureTutor(user);
    
    const { fullName, phone, subjects, hourlyRate, bio, availability, isActive } = req.body;
    
    // Explicitly update fields
    if (fullName !== undefined) tutor.fullName = fullName;
    if (phone !== undefined) tutor.phone = phone;
    if (subjects !== undefined) tutor.subjects = subjects;
    if (hourlyRate !== undefined) tutor.hourlyRate = Number(hourlyRate);
    if (bio !== undefined) tutor.bio = bio;
    if (availability !== undefined) tutor.availability = availability;
    if (isActive !== undefined) tutor.isActive = Boolean(isActive);

    await tutor.save();
    res.json(tutor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBookedSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query; // 'YYYY-MM-DD'
    if (!date) return res.status(400).json({ msg: 'Date is required' });

    const targetDate = new Date(date);
    targetDate.setHours(0,0,0,0);

    const bookings = await Booking.find({
      tutorId: id,
      date: targetDate,
      status: { $in: ['pending', 'confirmed', 'completed'] }
    }).select('startTime endTime');

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTutor = async (req, res) => {
  try {
    const tutor = new Tutor({
      ...req.body,
      createdBy: req.session.user.id
    });
    await tutor.save();
    res.status(201).json(tutor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTutors = async (req, res) => {
  try {
    const { search, subject, minPrice, maxPrice } = req.query;
    // Only fetch active tutors with prices set > 0
    const query = { isActive: true, hourlyRate: { $gt: 0 } };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    if (subject) {
      query.subjects = subject;
    }

    if (minPrice !== undefined && minPrice !== '') {
      const n = Number(minPrice);
      if (!Number.isNaN(n)) query.hourlyRate = { ...query.hourlyRate, $gte: n };
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      const n = Number(maxPrice);
      if (!Number.isNaN(n)) query.hourlyRate = { ...query.hourlyRate, $lte: n };
    }

    const tutors = await Tutor.find(query).lean();
    res.json(tutors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTutorById = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id).lean();
    if (!tutor) return res.status(404).json({ msg: 'Tutor not found' });
    res.json(tutor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTutor = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) return res.status(404).json({ msg: 'Tutor not found' });

    const user = req.session.user;
    if (tutor.createdBy.toString() !== user.id && user.role !== 'admin') {
      return res.status(403).json({ msg: 'Unauthorized to update this tutor' });
    }

    const updated = await Tutor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTutor = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) return res.status(404).json({ msg: 'Tutor not found' });

    const user = req.session.user;
    if (tutor.createdBy.toString() !== user.id && user.role !== 'admin') {
      return res.status(403).json({ msg: 'Unauthorized to delete this tutor' });
    }

    await tutor.deleteOne();
    res.json({ msg: 'Tutor deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


``


## server/routes/tutorRoutes.js

``javascript

const express = require('express');
const router = express.Router();
const {
  createTutor,
  getTutors,
  getTutorById,
  updateTutor,
  deleteTutor,
  getMyProfile,
  updateMyProfile,
  getBookedSlots
} = require('../controllers/tutorController');

const auth = require('../middleware/authMiddleware');

router.get('/me', auth, getMyProfile);
router.put('/me', auth, updateMyProfile);
router.get('/:id/booked-slots', getBookedSlots);

router.get('/', getTutors);
router.get('/:id', getTutorById);
router.post('/', auth, createTutor);
router.put('/:id', auth, updateTutor);
router.delete('/:id', auth, deleteTutor);

module.exports = router;


``


## server/controllers/reviewController.js

``javascript

const Review = require('../models/Review');
const Tutor = require('../models/Tutor');

exports.createReview = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { tutorId, bookingId, rating, comment } = req.body;
    
    // Create the review
    const review = await Review.create({
      tutorId,
      bookingId,
      userId,
      rating,
      comment: comment || ''
    });

    // Calculate new average rating
    const allReviews = await Review.find({ tutorId });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    // Update Tutor model
    await Tutor.findByIdAndUpdate(tutorId, {
      rating: parseFloat(avg.toFixed(1)),
      reviewCount: allReviews.length
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReviewsForTutor = async (req, res) => {
  try {
    const reviews = await Review.find({ tutorId: req.params.id })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .lean();
    const mapped = reviews.map(r => ({
      ...r,
      studentName: r.userId?.username || 'Student'
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



``


## server/routes/adminStats.js

``javascript

const express = require('express');
const router = express.Router();

const Subject = require('../models/Subject');
const Booking = require('../models/Booking');
const Tutor = require('../models/Tutor');
const Student = require('../models/Student');

router.get('/stats', async (req, res) => {
  try {
    const [totalSubjects, totalBookings, totalTutors, totalStudents, revenueBookings] = await Promise.all([
      Subject ? Subject.countDocuments().catch(() => 0) : 0, // In case Subject is unused
      Booking.countDocuments(),
      Tutor.countDocuments(),
      Student.countDocuments(),
      Booking.find({ status: { $in: ['confirmed', 'completed'] } })
    ]);

    const totalRevenue = revenueBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    res.json({
      totalSubjects: totalSubjects || 0,
      totalBookings,
      totalTutors,
      totalStudents,
      revenue: totalRevenue
    });
  } catch (err) {
    console.error('Failed to fetch stats:', err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

module.exports = router;


``


## client/src/App.jsx

``jsx

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import UserLoginRegister from './pages/UserLoginRegister';
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

// Navbars
import Navbar from './components/Navbar';
import NavbarPublic from './components/navPublic';

// Route guards
import UserRoute from './components/UserRoute';
import AdminRoute from './components/AdminRoute';

function AppContent() {
  const location = useLocation();

  const publicPaths = ['/', '/admin-register'];
  const isPublicPath = publicPaths.includes(location.pathname);
  // Landing page (`/`) includes its own Wyzant-style header; avoid double navbars.
  const showGlobalNav = location.pathname !== '/';

  return (
    <>
      {showGlobalNav && (isPublicPath ? <NavbarPublic /> : <Navbar />)}

      <Routes>
        <Route path="/" element={<UserLoginRegister />} />
        <Route path="/admin-register" element={<AdminRegister />} />
        <Route path="/home" element={<Home />} />
        <Route path="/tutors" element={<TutorListPage />} />
        <Route path="/tutor/:id" element={<TutorProfilePage />} />
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

        <Route path="/admin-dashboard" element={<AdminDashboard />} />
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


``


## client/src/pages/UserLoginRegister.jsx

``jsx

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/wyzant.css';

axios.defaults.withCredentials = true;

const emailValid = value =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const TRENDING = [
  'Accuplacer',
  'Algebra 1',
  'Algebra 2',
  'Calculus',
  'Chemistry',
  'Physics',
  'SAT Prep',
  'Statistics',
];

const HERO_IMAGES = {
  leftLarge:
    'https://images.unsplash.com/photo-1503676260728-1c56d1e8e8f0?auto=format&fit=crop&w=400&q=80',
  leftSmall:
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=280&q=80',
  rightLarge:
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80',
  rightSmall:
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=280&q=80',
};

function DiamondFrame({ src, alt, className = '', size = 'md' }) {
  const sz =
    size === 'lg' ? 'w-44 h-44 sm:w-52 sm:h-52' : 'w-28 h-28 sm:w-36 sm:h-36';
  return (
    <div
      className={`${sz} ${className} shrink-0 mx-auto shadow-lg`}
      style={{ transform: 'rotate(45deg)', borderRadius: '4px', overflow: 'hidden' }}
    >
      <div className="w-full h-full" style={{ transform: 'rotate(-45deg) scale(1.42)' }}>
        <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
      </div>
    </div>
  );
}

function MarketLogo() {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <div
        className="w-9 h-9 shrink-0"
        style={{
          background:
            'linear-gradient(135deg, #f5a623 0%, #f5a623 33%, #d4e86a 33%, #d4e86a 66%, #1b4332 66%)',
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        }}
      />
      <span className="text-lg sm:text-xl font-bold tracking-tight text-white">PeerWise</span>
    </div>
  );
}

function UserLoginRegister() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginSectionRef = useRef(null);
  const registerSectionRef = useRef(null);
  const scrollHandledRef = useRef(false);

  const [highlightSubject, setHighlightSubject] = useState('Mathematics');
  const [heroSearch, setHeroSearch] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [role, setRole] = useState('');

  const [loginErrors, setLoginErrors] = useState({});
  const [registerErrors, setRegisterErrors] = useState({});

  useEffect(() => {
    const hash = location.hash?.replace('#', '');
    const auth = location.state?.scrollAuth;

    if (auth === 'login' || hash === 'login') {
      loginSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (auth && !scrollHandledRef.current) {
        scrollHandledRef.current = true;
        navigate(location.pathname, { replace: true, state: {} });
      }
      return;
    }
    if (auth === 'signup' || hash === 'signup') {
      registerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (auth && !scrollHandledRef.current) {
        scrollHandledRef.current = true;
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.hash, location.state, location.pathname, navigate]);

  const scrollToLogin = () =>
    loginSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const scrollToRegister = () =>
    registerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleLoginChange = e => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
    if (loginErrors[name]) setLoginErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleRegisterChange = e => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
    if (registerErrors[name]) setRegisterErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validateLogin = () => {
    const next = {};
    if (!loginForm.email?.trim() || !emailValid(loginForm.email)) {
      next.email = 'Please enter a valid email';
    }
    if (!loginForm.password || loginForm.password.length < 6) {
      next.password = 'Password must be at least 6 characters';
    }
    setLoginErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateRegister = () => {
    const next = {};
    if (!registerForm.username?.trim() || registerForm.username.trim().length < 3) {
      next.username = 'Name must be at least 3 characters';
    }
    if (!registerForm.email?.trim() || !emailValid(registerForm.email)) {
      next.email = 'Please enter a valid email';
    }
    if (!registerForm.password || registerForm.password.length < 6) {
      next.password = 'Password must be at least 6 characters';
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      next.confirmPassword = 'Passwords do not match';
    }
    if (!role || (role !== 'student' && role !== 'tutor')) {
      next.role = 'Please select your role';
    }
    setRegisterErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLoginSubmit = async (e, demoCreds = null) => {
    if (e) e.preventDefault();
    
    let creds = loginForm;
    if (demoCreds) {
      creds = demoCreds;
      setLoginForm(demoCreds);
    } else {
      if (!validateLogin()) return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', creds);
      const { user } = res.data;
      toast.success(`Welcome back, ${user.username}!`);
      if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (user.role === 'tutor') {
        navigate('/tutor-dashboard');
      } else {
        navigate('/home');
      }
    } catch (err) {
      const msg =
        err.response?.data?.msg || 'Cannot reach server. Is the API running on port 5000?';
      toast.error(msg);
    }
  };

  const handleDemoStudentLogin = () => {
    handleLoginSubmit(null, { email: 'student@test.com', password: 'password123' });
  };

  const handleDemoTutorLogin = () => {
    handleLoginSubmit(null, { email: 'tutor@test.com', password: 'password123' });
  };

  const handleRegisterSubmit = async e => {
    e.preventDefault();
    if (!validateRegister()) return;
    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        role,
      });
      toast.success('Registered successfully! Please log in.');
      scrollToLogin();
    } catch (err) {
      const msg =
        err.response?.data?.msg ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot reach server. Is the API running on port 5000?'
          : 'Something went wrong');
      toast.error(msg);
    }
  };

  const handleHeroSearch = e => {
    e.preventDefault();
    const q = heroSearch.trim();
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    navigate(`/tutors${params.toString() ? `?${params}` : ''}`);
  };

  const inputClass =
    'w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-market-ink placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-market-orange/40 focus:border-market-orange transition-shadow';

  return (
    <div className="min-h-screen flex flex-col font-sans bg-market-cream text-market-ink">
      <header className="sticky top-0 z-50 bg-market-nav shadow-md">
        <div className="max-w-7xl mx-auto min-h-[56px] px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 py-2">
          <button type="button" onClick={() => navigate('/home')} className="flex items-center gap-2 min-w-0">
            <MarketLogo />
          </button>

          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-semibold text-white/95 uppercase tracking-wide">
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="hover:text-market-lime transition-colors"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate('/tutors')}
              className="hover:text-market-lime transition-colors"
            >
              Find a tutor
            </button>
            <button type="button" onClick={scrollToRegister} className="hover:text-market-lime transition-colors">
              Become a tutor
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={scrollToLogin}
              className="text-white/90 text-sm font-semibold px-3 py-1.5 rounded hover:bg-white/10 transition-colors"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={scrollToRegister}
              className="text-market-orange text-sm font-bold uppercase tracking-wide px-3 py-1.5 rounded hover:text-market-lime transition-colors"
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-black/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#ebe8e3] to-market-cream pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-14 lg:pt-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">
            <div className="hidden lg:flex lg:col-span-3 flex-col items-center gap-6 pl-2">
              <DiamondFrame src={HERO_IMAGES.leftLarge} alt="Tutor" size="lg" className="ring-4 ring-white/80" />
              <div className="flex gap-4 items-start">
                <div
                  className="w-10 h-10 bg-market-orange opacity-90"
                  style={{ transform: 'rotate(45deg)', borderRadius: 2 }}
                />
                <DiamondFrame
                  src={HERO_IMAGES.leftSmall}
                  alt="Tutor session"
                  size="md"
                  className="ring-2 ring-white/80"
                />
              </div>
              <div
                className="w-8 h-8 bg-market-lime opacity-90"
                style={{ transform: 'rotate(45deg)', borderRadius: 2 }}
              />
            </div>

            <div className="lg:col-span-6 text-center px-2">
              <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold text-market-ink leading-tight tracking-tight">
                Trust the nation&apos;s largest network for{' '}
                <span className="relative inline-block px-1">
                  <span className="relative z-10 px-2 py-0.5 bg-market-lime/90 text-market-ink rounded-sm">
                    {highlightSubject}
                  </span>
                </span>{' '}
                tutors
              </h1>

              <div className="flex flex-wrap justify-center gap-2 mt-3 mb-2">
                {['Mathematics', 'French', 'Calculus', 'Chemistry', 'Physics'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setHighlightSubject(s)}
                    className={`text-xs font-semibold px-2 py-1 rounded-full border border-gray-300/80 bg-white/80 text-gray-700 hover:border-market-orange transition-colors ${
                      highlightSubject === s ? 'border-market-orange text-market-orange' : ''
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <form onSubmit={handleHeroSearch} className="mt-8 max-w-2xl mx-auto">
                <div className="flex rounded-lg shadow-lg overflow-hidden bg-white border border-gray-200/80">
                  <input
                    value={heroSearch}
                    onChange={e => setHeroSearch(e.target.value)}
                    placeholder="What would you like to learn?"
                    className="flex-1 min-w-0 px-5 py-4 text-base text-gray-800 placeholder-gray-400 outline-none"
                    aria-label="Search subjects"
                  />
                  <button
                    type="submit"
                    className="shrink-0 w-16 sm:w-[4.5rem] bg-market-orange hover:bg-market-orange-hover flex items-center justify-center transition-colors"
                    aria-label="Search"
                  >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </div>
              </form>

              <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
                <span className="text-gray-500 font-medium">Trending:</span>
                {TRENDING.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setHeroSearch(tag);
                      setHighlightSubject(tag);
                    }}
                    className="px-3 py-1 rounded-full bg-gray-200/80 text-gray-700 hover:bg-market-orange/20 hover:text-market-ink transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex lg:col-span-3 flex-col items-center gap-5 pr-2">
              <div
                className="w-9 h-9 bg-market-orange opacity-90"
                style={{ transform: 'rotate(45deg)', borderRadius: 2 }}
              />
              <DiamondFrame
                src={HERO_IMAGES.rightLarge}
                alt="Student learning"
                size="lg"
                className="ring-4 ring-white/80"
              />
              <div className="flex gap-4 items-end">
                <div
                  className="w-8 h-8 bg-market-forest opacity-90"
                  style={{ transform: 'rotate(45deg)', borderRadius: 2 }}
                />
                <DiamondFrame src={HERO_IMAGES.rightSmall} alt="Study" size="md" className="ring-2 ring-white/80" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-14 pt-10 border-t border-gray-300/40">
            {[
              {
                color: 'bg-market-lime',
                body: (
                  <>
                    More than <strong className="text-market-ink">4 million 5-star reviews</strong>
                  </>
                ),
              },
              {
                color: 'bg-market-orange',
                body: (
                  <>
                    <strong className="text-market-ink">65,000 expert tutors</strong> in 300+ subjects
                  </>
                ),
              },
              {
                color: 'bg-market-forest',
                body: (
                  <>
                    Find a great match with our <strong className="text-white">Good Fit Guarantee</strong>
                  </>
                ),
              },
            ].map((row, i) => (
              <div key={i} className="flex gap-4 items-start text-left sm:text-center md:text-left">
                <div
                  className={`w-12 h-12 shrink-0 ${row.color} shadow-md`}
                  style={{ transform: 'rotate(45deg)', borderRadius: 3 }}
                />
                <p className="text-sm sm:text-base text-gray-700 leading-snug pt-1">{row.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex-1 flex flex-col gap-12 py-14 px-4 bg-market-cream">
        <div ref={loginSectionRef} id="login-section" className="scroll-mt-28 max-w-md w-full mx-auto">
          <form
            onSubmit={handleLoginSubmit}
            className="bg-white rounded-2xl shadow-xl border border-gray-200/80 p-8 space-y-5"
          >
            <h2 className="text-market-ink text-2xl font-bold text-center">Log in</h2>
            <p className="text-center text-sm text-gray-600">Welcome back â€” sign in with your email.</p>

            {/* DEMO LOGIN BUTTONS */}
            <div className="flex gap-2 justify-center mb-4">
              <button 
                type="button" 
                onClick={handleDemoStudentLogin}
                className="flex-1 bg-amber-100 text-amber-800 text-xs font-bold py-2 rounded border border-amber-200 hover:bg-amber-200 transition-colors"
              >
                ðŸŽ“ Demo Student
              </button>
              <button 
                type="button" 
                onClick={handleDemoTutorLogin}
                className="flex-1 bg-teal-100 text-teal-800 text-xs font-bold py-2 rounded border border-teal-200 hover:bg-teal-200 transition-colors"
              >
                ðŸ§‘â€ðŸ« Demo Tutor
              </button>
            </div>

            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-market-ink mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                className={inputClass}
              />
              {loginErrors.email && <p className="mt-1 text-sm text-red-600">{loginErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-market-ink mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={loginForm.password}
                onChange={handleLoginChange}
                className={inputClass}
              />
              {loginErrors.password && <p className="mt-1 text-sm text-red-600">{loginErrors.password}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-lg bg-market-orange text-white font-bold hover:bg-market-orange-hover transition-colors shadow-md"
            >
              Log in
            </button>

            <p className="text-center text-sm text-gray-600">
              New here?{' '}
              <button type="button" onClick={scrollToRegister} className="font-semibold text-market-orange hover:underline">
                Create an account
              </button>
            </p>
          </form>
        </div>

        <div ref={registerSectionRef} id="signup-section" className="scroll-mt-28 max-w-md w-full mx-auto">
          <form
            onSubmit={handleRegisterSubmit}
            className="bg-white rounded-2xl shadow-xl border border-gray-200/80 p-8 space-y-5"
          >
            <h2 className="text-market-ink text-2xl font-bold text-center">Sign up</h2>
            <p className="text-center text-sm text-gray-600">Create your free account.</p>

            <div>
              <p className="text-sm font-semibold text-market-ink mb-2 text-center">I am aâ€¦</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRole('student');
                    if (registerErrors.role) setRegisterErrors(prev => ({ ...prev, role: undefined }));
                  }}
                  className={`rounded-xl border-2 p-4 text-center transition-all ${
                    role === 'student'
                      ? 'border-market-orange bg-amber-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl block mb-1" aria-hidden>
                    ðŸ‘¨â€ðŸŽ“
                  </span>
                  <span className="font-semibold text-market-ink text-sm">Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('tutor');
                    if (registerErrors.role) setRegisterErrors(prev => ({ ...prev, role: undefined }));
                  }}
                  className={`rounded-xl border-2 p-4 text-center transition-all ${
                    role === 'tutor'
                      ? 'border-market-orange bg-amber-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl block mb-1" aria-hidden>
                    ðŸ§‘â€ðŸ«
                  </span>
                  <span className="font-semibold text-market-ink text-sm">Tutor</span>
                </button>
              </div>
              {registerErrors.role && (
                <p className="mt-1 text-sm text-red-600 text-center">{registerErrors.role}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-username" className="block text-sm font-semibold text-market-ink mb-1.5">
                Full name
              </label>
              <input
                id="reg-username"
                name="username"
                type="text"
                autoComplete="name"
                value={registerForm.username}
                onChange={handleRegisterChange}
                className={inputClass}
              />
              {registerErrors.username && (
                <p className="mt-1 text-sm text-red-600">{registerErrors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-market-ink mb-1.5">
                Email
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                className={inputClass}
              />
              {registerErrors.email && <p className="mt-1 text-sm text-red-600">{registerErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-market-ink mb-1.5">
                Password
              </label>
              <input
                id="reg-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                className={inputClass}
              />
              {registerErrors.password && (
                <p className="mt-1 text-sm text-red-600">{registerErrors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-semibold text-market-ink mb-1.5">
                Confirm password
              </label>
              <input
                id="reg-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={registerForm.confirmPassword}
                onChange={handleRegisterChange}
                className={inputClass}
              />
              {registerErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{registerErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-lg bg-market-orange text-white font-bold hover:bg-market-orange-hover transition-colors shadow-md"
            >
              Create account
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button type="button" onClick={scrollToLogin} className="font-semibold text-market-orange hover:underline">
                Log in
              </button>
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 pb-8">
          <button
            type="button"
            onClick={() => navigate('/admin-register')}
            className="text-market-forest font-semibold hover:underline"
          >
            Admin registration
          </button>
        </p>
      </div>

      <footer className="border-t border-gray-300/60 bg-market-nav py-6 text-center text-sm text-white/70">
        <p>Â© {new Date().getFullYear()} PeerWise Â· Good Fit Guarantee Â· Learn together</p>
      </footer>
    </div>
  );
}

export default UserLoginRegister;


``


## client/src/pages/TutorDashboard.jsx

``jsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import '../styles/wyzant.css';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const ALL_SUBJECTS = ['Mathematics', 'Science', 'Information Technology', 'Languages', 'English', 'Other'];

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
    try {
      setLoading(true);
      const [profRes, bookRes] = await Promise.all([
        axios.get('http://localhost:5000/api/tutors/me', { withCredentials: true }),
        axios.get(`http://localhost:5000/api/bookings/user/me`, { withCredentials: true }) // Uses session 
      ]);
      setProfile(profRes.data);
      setFormData(profRes.data);
      // Filter out student bookings if any, keep only where user is the tutor
      const myTutorBookings = bookRes.data.filter(b => b.isTutorView);
      setBookings(myTutorBookings);
    } catch (err) {
      if (err.response?.status === 403) {
         navigate('/home');
      } else {
        toast.error('Failed to load dashboard.');
      }
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
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
                <div className="text-gray-600 text-sm">Rating: <span className="font-bold text-yellow-500 mr-1">â˜…</span>{profile.rating || '4.8'} ({profile.reviewCount || 0} reviews)</div>
                <div className="text-gray-600 text-sm">Rate: <span className="font-semibold text-gray-900">Rs. {profile.hourlyRate} / hr</span></div>
                <div className="text-gray-600 text-sm">Status: <span className={profile.isActive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{profile.isActive ? 'Active' : 'Hidden'}</span></div>
                
                <div className="pt-2">
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


``


## client/src/pages/BookingForm.jsx

``jsx

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  isBefore, startOfDay, parse, MINUTE 
} from 'date-fns';
import { Calendar as CalIcon, Clock, CreditCard, ChevronLeft, ChevronRight, CheckCircle, Info, ShieldCheck } from 'lucide-react';
import logo from '../assets/logo.svg';
import '../styles/wyzant.css';

function initials(name) {
  return (name || '?').trim()?.[0]?.toUpperCase() || '?';
}

function generateTimeSlots(availStart, availEnd, bookedSlots) {
  if (!availStart || !availEnd) return [];
  const slots = [];
  let curr = parse(availStart, 'HH:mm', new Date());
  const end = parse(availEnd, 'HH:mm', new Date());

  while (isBefore(curr, end)) {
    const slotString = format(curr, 'HH:mm');
    // Assume 1 hour session duration for this mock
    const slotEndString = format(addDays(curr, 0).setHours(curr.getHours() + 1), 'HH:mm');
    
    // Check overlapping
    const isBooked = bookedSlots.some(b => {
      // Very basic collision logic
      return (slotString >= b.startTime && slotString < b.endTime) || 
             (slotEndString > b.startTime && slotEndString <= b.endTime);
    });

    if (!isBooked) {
      slots.push(slotString);
    }
    curr.setHours(curr.getHours() + 1);
  }
  return slots;
}

function BookingForm() {
  const { id: tutorId } = useParams();
  const navigate = useNavigate();

  const [tutor, setTutor] = useState(null);
  const [loadingTutor, setLoadingTutor] = useState(true);

  const [step, setStep] = useState(1);
  
  // Date/Time Step States
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Form Details Step
  const [form, setForm] = useState({ subject: '', notes: '' });

  // Payment Step
  const [payment, setPayment] = useState({ nameOnCard: '', cardNumber: '', expiry: '', cvv: '' });
  
  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLoadingTutor(true);
    axios.get(`http://localhost:5000/api/tutors/${tutorId}`, { withCredentials: true })
      .then(res => setTutor(res.data))
      .catch(err => {
        toast.error('Failed to load tutor');
        setTutor(null);
      })
      .finally(() => setLoadingTutor(false));
  }, [tutorId]);

  // Fetch slots when date changes
  useEffect(() => {
    if (!selectedDate || !tutor) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const res = await axios.get(`http://localhost:5000/api/tutors/${tutor._id}/booked-slots?date=${dateStr}`);
        const booked = res.data;
        
        const dayName = format(selectedDate, 'EEEE').toLowerCase();
        const availability = (tutor.availability || []).find(a => a.day === dayName);

        if (!availability || !availability.startTime || !availability.endTime) {
          setAvailableSlots([]);
          return;
        }

        const slots = generateTimeSlots(availability.startTime, availability.endTime, booked);
        
        // Filter out past times if today
        if (isSameDay(selectedDate, new Date())) {
          const nowStr = format(new Date(), 'HH:mm');
          setAvailableSlots(slots.filter(s => s > nowStr));
        } else {
          setAvailableSlots(slots);
        }
      } catch (err) {
        toast.error('Failed to get available times');
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, tutor]);

  // Calendar render logic
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const rows = [];
    let days = [];
    let day = startDate;

    const today = startOfDay(new Date());

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isPast = isBefore(day, today);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        
        // Check if tutor works this day of week generally
        const dayName = format(day, 'EEEE').toLowerCase();
        const hasAvailability = tutor?.availability?.some(a => a.day === dayName && a.startTime);

        days.push(
          <button
            type="button"
            key={day}
            disabled={!isSameMonth(day, monthStart) || isPast || !hasAvailability}
            onClick={() => { setSelectedDate(cloneDay); setSelectedTime(null); }}
            className={`
              w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold transition-all
              ${!isSameMonth(day, monthStart) || isPast ? 'text-gray-300 cursor-not-allowed' : 
                !hasAvailability ? 'text-gray-400 bg-gray-50' :
                isSelected ? 'bg-wyzant-teal text-white shadow-md transform scale-105' : 
                'text-gray-700 hover:bg-teal-50 hover:text-wyzant-teal'
              }
            `}
          >
            {format(day, 'd')}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="flex justify-between w-full mb-2" key={day}>{days}</div>);
      days = [];
    }
    return rows;
  };

  const handleNext = () => setStep(p => p + 1);
  const handleBack = () => setStep(p => p - 1);

  const confirmBooking = async (e) => {
    e.preventDefault();
    if (!payment.cardNumber || payment.cardNumber.length < 15) {
      toast.error('Invalid mock card number');
      return;
    }
    
    setSubmitting(true);
    try {
      // Calculate endTime (assume +1 hour layout)
      const endHrs = parseInt(selectedTime.split(':')[0]) + 1;
      const endMins = selectedTime.split(':')[1];
      const endTime = `${endHrs.toString().padStart(2, '0')}:${endMins}`;

      await axios.post('http://localhost:5000/api/bookings', {
        tutorId,
        subject: form.subject || tutor.subjects[0] || 'Peer Tutoring',
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedTime,
        endTime,
        notes: form.notes,
        paymentMethod: 'mock_stripe'
      }, { withCredentials: true });
      
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTutor) return <div className="min-h-screen flex justify-center items-center font-bold text-gray-500">Loading Scheduling UI...</div>;
  if (!tutor) return <div className="min-h-screen flex justify-center items-center font-bold text-red-500">Tutor not found</div>;

  const hourlyRate = tutor.hourlyRate || 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 py-4 px-6 fixed top-0 w-full z-10 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-8 h-8" />
          <span className="font-bold text-xl text-wyzant-teal">PeerWise</span>
        </div>
        {!success && <button onClick={() => navigate(-1)} className="text-sm font-semibold text-gray-500 hover:text-gray-800">Cancel</button>}
      </header>

      {/* SUCCESS MODAL FULLSCREEN */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
              <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
            </motion.div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-md">
              Your session with {tutor.fullName} has been scheduled for {format(selectedDate, 'EEEE, MMMM do')} at {selectedTime}. A confirmation email has been dispatched.
            </p>
            <button onClick={() => navigate('/my-bookings')} className="bg-wyzant-teal hover:bg-wyzant-teal-dark text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors shadow-lg">
              View My Bookings
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-5xl mx-auto w-full pt-28 pb-12 px-4 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* LEFT COMPONENT - TUTOR INFO FIXED */}
        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 self-start md:sticky md:top-28">
          <div className="flex flex-col items-center text-center border-b border-gray-100 pb-6 mb-6">
            <div className="w-20 h-20 bg-wyzant-teal text-white rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-md">
              {initials(tutor.fullName)}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{tutor.fullName}</h2>
            <p className="text-gray-500 text-sm mt-1 mb-2">{(tutor.subjects || []).join(' â€¢ ')}</p>
            <span className="bg-teal-50 text-teal-800 font-bold px-3 py-1 rounded-full text-sm tracking-wide">
              Rs. {hourlyRate} / hr
            </span>
          </div>
          
          <div className="space-y-4">
            {selectedDate && (
              <div className="flex items-start gap-3">
                <CalIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="text-gray-700 font-medium">{format(selectedDate, 'EEEE, MMMM do, yyyy')}</div>
              </div>
            )}
            {selectedTime && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="text-gray-700 font-medium">{selectedTime} - {parseInt(selectedTime.split(':')[0])+1}:{selectedTime.split(':')[1]} (1 hr)</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COMPONENT - STEPPER FLOW */}
        <div className="md:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[500px] flex flex-col">
          
          {/* STEP PROGRESS */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">
              {step === 1 ? 'Select a Time' : step === 2 ? 'Session Details' : 'Secure Checkout'}
            </h1>
            <div className="flex gap-2 text-sm font-semibold">
              <span className={step >= 1 ? 'text-wyzant-teal' : 'text-gray-300'}>Time</span>
              <span className="text-gray-300">â€º</span>
              <span className={step >= 2 ? 'text-wyzant-teal' : 'text-gray-300'}>Details</span>
              <span className="text-gray-300">â€º</span>
              <span className={step >= 3 ? 'text-wyzant-teal' : 'text-gray-300'}>Payment</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col sm:flex-row gap-8">
                
                {/* CALENDAR */}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
                    <div className="font-bold text-gray-800">{format(currentMonth, 'MMMM yyyy')}</div>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight className="w-5 h-5" /></button>
                  </div>
                  <div className="flex justify-between w-full mb-4 text-xs font-bold text-gray-400 uppercase">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="w-10 text-center">{d}</div>)}
                  </div>
                  <div className="flex flex-col w-full">
                    {renderCalendar()}
                  </div>
                </div>

                {/* SLOTS COLUMN */}
                {selectedDate && (
                  <div className="w-full sm:w-48 border-l border-gray-100 pl-8 overflow-y-auto max-h-[340px] pr-2 custom-scrollbar">
                    <div className="font-medium text-gray-600 mb-4">{format(selectedDate, 'EEEE, MMM d')}</div>
                    
                    {loadingSlots ? (
                      <div className="animate-pulse space-y-3">
                        <div className="h-12 bg-gray-100 rounded-lg w-full"></div>
                        <div className="h-12 bg-gray-100 rounded-lg w-full"></div>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {availableSlots.map(time => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`py-3 px-4 rounded-xl border text-center font-bold transition-all ${
                              selectedTime === time 
                                ? 'bg-wyzant-teal border-wyzant-teal text-white shadow-md transform scale-[1.02]' 
                                : 'border-gray-200 text-wyzant-teal hover:border-wyzant-teal hover:bg-teal-50'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No available times.</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Subject Selection</label>
                  <select 
                    value={form.subject} 
                    onChange={e => setForm({...form, subject: e.target.value})}
                    className="w-full border-gray-300 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wyzant-teal"
                  >
                    <option value="" disabled>Select the subject you need help with...</option>
                    {(tutor.subjects || ['Peer Tutoring']).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Notes for {tutor.fullName} (Optional)</label>
                  <textarea 
                    value={form.notes} 
                    onChange={e => setForm({...form, notes: e.target.value})}
                    placeholder="Share what you'd like to cover in this session to help the tutor prepare..."
                    rows={4}
                    className="w-full border-gray-300 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wyzant-teal resize-none"
                  ></textarea>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start mb-6">
                  <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
                  <p className="text-sm text-blue-800">
                    <strong>Demo Checkout Environment.</strong> This is a secure simulation. No real charges will be made, but transactions are logged appropriately in the database.
                  </p>
                </div>

                <form id="payment-form" onSubmit={confirmBooking} className="space-y-5 bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Name on Card</label>
                    <input type="text" value={payment.nameOnCard} onChange={e=>setPayment({...payment, nameOnCard: e.target.value})} required className="w-full px-4 py-3 rounded border border-gray-300 focus:outline-none" placeholder="Isabella Williams" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Card Number</label>
                    <div className="relative">
                      <CreditCard className="absolute top-3.5 left-3 w-5 h-5 text-gray-400" />
                      <input type="text" value={payment.cardNumber} onChange={e=>setPayment({...payment, cardNumber: e.target.value})} required className="w-full pl-10 pr-4 py-3 rounded border border-gray-300 focus:outline-none tracking-widest" placeholder="4242 4242 4242 4242" maxLength={19} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Expiration</label>
                      <input type="text" value={payment.expiry} onChange={e=>setPayment({...payment, expiry: e.target.value})} required className="w-full px-4 py-3 rounded border border-gray-300 focus:outline-none" placeholder="12/26" maxLength={5} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Security Code</label>
                      <input type="text" value={payment.cvv} onChange={e=>setPayment({...payment, cvv: e.target.value})} required className="w-full px-4 py-3 rounded border border-gray-300 focus:outline-none" placeholder="CVV" maxLength={4} />
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* NEXT/PREV BUTTONS */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
            {step > 1 ? (
              <button disabled={submitting} onClick={handleBack} className="px-6 py-2.5 rounded-lg border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Back
              </button>
            ) : <div></div>}

            {step === 1 && (
              <button 
                onClick={handleNext} 
                disabled={!selectedDate || !selectedTime}
                className={`px-8 py-3 rounded-lg font-bold transition-all shadow-md ${!selectedDate || !selectedTime ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-wyzant-teal text-white hover:bg-wyzant-teal-dark'}`}
              >
                Next Step
              </button>
            )}
            
            {step === 2 && (
              <button 
                onClick={handleNext} 
                disabled={!form.subject}
                className={`px-8 py-3 rounded-lg font-bold transition-all shadow-md ${!form.subject ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-wyzant-teal text-white hover:bg-wyzant-teal-dark'}`}
              >
                Go to Payment
              </button>
            )}

            {step === 3 && (
              <button 
                type="submit" form="payment-form" disabled={submitting}
                className="px-8 py-3 rounded-lg font-bold transition-all shadow-lg bg-wyzant-teal text-white hover:bg-wyzant-teal-dark"
              >
                {submitting ? 'Processing...' : `Pay Rs. ${hourlyRate} & Confirm`}
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default BookingForm;


``


## client/src/pages/MyBookingsPage.jsx

``jsx

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../assets/logo.svg';

function initials(name) {
  return (name || '?').trim()?.[0]?.toUpperCase() || '?';
}

function minutesBetween(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if ([sh, sm, eh, em].some(n => Number.isNaN(n))) return 0;
  return (eh * 60 + em) - (sh * 60 + sm);
}

function formatDate(d) {
  if (!d) return '-';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString();
}

function statusBadgeClass(status) {
  if (status === 'confirmed') return 'bg-green-100 text-green-700 border border-green-300';
  if (status === 'cancelled') return 'bg-red-100 text-red-700 border border-red-300';
  return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
}

function stars(rating) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  const full = Math.round(value);
  return 'â˜…â˜…â˜…â˜…â˜…'.slice(0, full).padEnd(5, 'â˜†');
}

function MyBookingsPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('all'); // all | pending | confirmed | cancelled
  const [search, setSearch] = useState('');

  // Review modal state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/auth/session', { withCredentials: true })
      .then(res => setUser(res.data.user))
      .catch(() => {
        toast.warning('Session expired. Please log in again.');
        navigate('/');
      });
  }, [navigate]);

  const fetchBookings = async studentId => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/bookings/student/${studentId}`, { withCredentials: true });
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchBookings(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const pending = bookings.filter(b => !b.status || b.status === 'pending').length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    return { total, confirmed, pending, completed, cancelled };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();

    return bookings
      .filter(b => {
        if (activeTab === 'all') return true;
        return (b.status || 'pending') === activeTab;
      })
      .filter(b => {
        if (!q) return true;
        const tutorName =
          b?.tutor?.fullName ||
          b?.tutorName ||
          b?.tutor?.username ||
          '';
        const subject = b?.subject || '';
        return tutorName.toLowerCase().includes(q) || subject.toLowerCase().includes(q);
      });
  }, [bookings, activeTab, search]);

  const generatePDFReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18).text('My Bookings Report - PeerWise', 14, 22);
    doc.setFontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const columns = ['Tutor', 'Subject', 'Date', 'Time', 'Status', 'Cost'];
    const rows = filteredBookings.map(b => {
      const tutorName = b?.tutor?.fullName || b?.tutorName || 'Tutor';
      const date = formatDate(b?.date);
      const time = b?.startTime && b?.endTime ? `${b.startTime} - ${b.endTime}` : '-';
      const mins = minutesBetween(b?.startTime, b?.endTime);
      const hours = Math.max(0, mins) / 60;
      const hourly = Number(b?.tutor?.hourlyRate) || Number(b?.hourlyRate) || 0;
      const cost = mins > 0 ? `Rs. ${(hourly * hours).toFixed(0)}` : '-';
      return [tutorName, b?.subject || '-', date, time, b?.status || 'pending', cost];
    });

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 166, 153] },
    });

    doc.save(`My_Bookings_Report_${Date.now()}.pdf`);
  };

  const cancelBooking = async bookingId => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await axios.patch(
        `http://localhost:5000/api/bookings/${bookingId}/status`,
        { status: 'cancelled' },
        { withCredentials: true },
      );
      toast.success('Booking cancelled successfully');
      if (user?.id) fetchBookings(user.id);
    } catch (err) {
      const msg = err.response?.data?.msg || 'Failed to cancel booking';
      toast.error(msg);
    }
  };

  const openReviewModal = booking => {
    setReviewBooking(booking);
    setReviewRating(0);
    setReviewComment('');
    setReviewError('');
    setReviewOpen(true);
  };

  const submitReview = async () => {
    if (!reviewRating) {
      setReviewError('Please select a rating');
      return;
    }
    setReviewSubmitting(true);
    try {
      await axios.post(
        'http://localhost:5000/api/reviews',
        {
          bookingId: reviewBooking?._id,
          tutorId: reviewBooking?.tutorId?._id || reviewBooking?.tutorId,
          rating: reviewRating,
          comment: reviewComment?.trim() || '',
        },
        { withCredentials: true },
      );
      toast.success('Review submitted! Thank you!');
      setReviewOpen(false);
      setReviewBooking(null);
    } catch (err) {
      const msg = err.response?.data?.msg || 'Failed to submit review';
      toast.error(msg);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] p-6 mb-4 animate-pulse">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-14 h-14 rounded-full bg-gray-200" />
          <div className="flex-1">
            <div className="h-5 w-2/5 bg-gray-200 rounded mb-3" />
            <div className="h-4 w-1/3 bg-gray-200 rounded mb-3" />
            <div className="h-4 w-4/5 bg-gray-200 rounded mb-3" />
            <div className="h-4 w-3/5 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-7 w-24 bg-gray-200 rounded-full" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFFFFF] shadow-md h-16">
        <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="PeerWise logo" className="h-8 w-8" />
            <span className="text-2xl font-bold text-wyzant-teal">PeerWise</span>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-[#2C3E50] font-semibold">
            <button type="button" onClick={() => navigate('/tutors')} className="hover:text-wyzant-teal transition-colors">
              Find a Tutor
            </button>
            <button type="button" onClick={() => navigate('/home')} className="hover:text-wyzant-teal transition-colors">
              How It Works
            </button>
            <button type="button" onClick={() => navigate('/home')} className="hover:text-wyzant-teal transition-colors">
              Subjects
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-4 py-2 rounded-lg border border-wyzant-teal text-wyzant-teal font-semibold hover:bg-wyzant-teal-light transition-colors"
            >
              {user?.username || 'Profile'}
            </button>
          </div>
        </div>
      </header>

      {/* PAGE HEADER */}
      <div className="pt-16">
        <div className="bg-gradient-to-b from-wyzant-teal to-teal-800">
          <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-white text-4xl font-bold">My Bookings</h1>
              <p className="text-white/80 mt-3">Manage your tutoring sessions</p>
            </div>
            <button
              type="button"
              onClick={generatePDFReport}
              className="bg-wyzant-teal text-white rounded-lg px-4 py-2 font-semibold hover:bg-wyzant-teal-dark transition self-center md:self-auto shadow"
            >
              ðŸ“„ Download Report
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Bookings', value: stats.total, icon: 'ðŸ“…', iconBg: 'bg-wyzant-teal-light' },
            { label: 'Upcoming Sessions', value: stats.confirmed, icon: 'âœ…', iconBg: 'bg-green-50' },
            { label: 'Pending', value: stats.pending, icon: 'â³', iconBg: 'bg-yellow-50' },
            { label: 'Completed', value: stats.completed, icon: 'ðŸŽ“', iconBg: 'bg-purple-50' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                <span className="text-xl">{card.icon}</span>
              </div>
              <div>
                <div className="text-[#6C757D] text-sm font-semibold">{card.label}</div>
                <div className="text-[#2C3E50] text-2xl font-bold">{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* FILTER TABS + SEARCH */}
        <div className="mt-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'confirmed', label: 'Confirmed' },
              { key: 'completed', label: 'Completed' },
              { key: 'cancelled', label: 'Cancelled' },
            ].map(t => {
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={
                    active
                      ? 'bg-wyzant-teal text-white rounded-full px-6 py-2 font-semibold'
                      : 'bg-white border border-[#E0E0E0] text-[#6C757D] rounded-full px-6 py-2 font-semibold hover:border-wyzant-teal transition'
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="w-full lg:max-w-md">
            <div className="bg-white rounded-full shadow-lg px-3 py-2 flex items-center gap-3 border border-[#E0E0E0]">
              <div className="px-2">ðŸ”</div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by tutor name or subject..."
                className="flex-1 px-2 py-2 rounded-full outline-none bg-transparent text-[#2C3E50]"
              />
            </div>
          </div>
        </div>

        {/* BOOKINGS LIST */}
        <div className="mt-8">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : filteredBookings.length ? (
            filteredBookings.map(b => {
              const tutorObj = typeof b?.tutorId === 'object' ? b.tutorId : b?.tutor;
              const tutorName = tutorObj?.fullName || b?.tutorName || 'Tutor';
              const tutorRate = Number(tutorObj?.hourlyRate) || Number(b?.hourlyRate) || 0;
              const avatar = initials(tutorName);
              const status = b?.status || 'pending';
              const mins = minutesBetween(b?.startTime, b?.endTime);
              const hours = Math.max(0, mins) / 60;
              const cost = mins > 0 ? (tutorRate * hours).toFixed(0) : '0';
              const durationText = mins > 0 ? `${mins} mins` : '-';
              const timeText = b?.startTime && b?.endTime ? `${b.startTime} - ${b.endTime}` : '-';
              const subject = b?.subject || '-';
              const notes = b?.notes?.trim();
              const tutorId = tutorObj?._id || b?.tutorId;

              return (
                <div key={b._id} className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] p-6 mb-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 rounded-full bg-wyzant-teal text-white flex items-center justify-center text-xl font-bold">
                        {avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="font-bold text-[#2C3E50] text-lg">{tutorName}</div>
                          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusBadgeClass(status)}`}>
                            {status}
                          </span>
                        </div>

                        <div className="text-[#6C757D] font-semibold mt-1">{subject}</div>

                        <div className="mt-3 text-sm text-[#2C3E50] flex flex-wrap gap-4">
                          <span>ðŸ“… {formatDate(b?.date)}</span>
                          <span>ðŸ• {timeText}</span>
                          <span>â±ï¸ {durationText}</span>
                        </div>

                        <div className="mt-2 text-sm text-[#2C3E50] font-semibold">ðŸ’° Total Cost: Rs. {cost}</div>

                        {notes ? <div className="mt-2 text-sm text-[#6C757D]">ðŸ“ {notes}</div> : null}

                        <div className="mt-5 flex flex-wrap gap-3">
                          {status === 'completed' && (
                            <button
                              type="button"
                              onClick={() => openReviewModal(b)}
                              className="bg-[#F5A623] text-white rounded-lg px-4 py-2 font-semibold hover:bg-[#E28F0B] transition"
                            >
                              Leave a Review
                            </button>
                          )}

                          {status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => cancelBooking(b._id)}
                              className="border border-red-400 text-red-500 rounded-lg px-4 py-2 font-semibold hover:bg-red-50 transition"
                            >
                              Cancel
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => navigate(`/tutor/${tutorId}`)}
                            className="border border-wyzant-teal text-wyzant-teal rounded-lg px-4 py-2 font-semibold hover:bg-wyzant-teal-light transition"
                          >
                            View Tutor
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 flex flex-col items-center text-center">
              <div className="text-6xl">ðŸ“…</div>
              <div className="text-[#2C3E50] font-bold text-2xl mt-3">No bookings yet!</div>
              <div className="text-[#6C757D] mt-2">Find a tutor and book your first session</div>
              <button
                type="button"
                onClick={() => navigate('/tutors')}
                className="mt-6 bg-wyzant-teal text-white rounded-xl px-8 py-3 font-bold hover:bg-wyzant-teal-dark transition"
              >
                Find a Tutor
              </button>
            </div>
          )}
        </div>
      </div>

      {/* REVIEW MODAL */}
      {reviewOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto w-full">
            <div className="text-[#2C3E50] font-bold text-xl">Rate Your Session</div>
            <div className="text-[#6C757D] mt-1">
              {(() => {
                const tutorObj = typeof reviewBooking?.tutorId === 'object' ? reviewBooking.tutorId : reviewBooking?.tutor;
                return tutorObj?.fullName || reviewBooking?.tutorName || 'Tutor';
              })()}
            </div>

            <div className="mt-6 flex items-center justify-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const star = i + 1;
                const selected = reviewRating >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setReviewRating(star);
                      setReviewError('');
                    }}
                    className={`text-4xl ${selected ? 'text-[#F5A623]' : 'text-gray-300'} transition-transform hover:scale-105`}
                    aria-label={`Rate ${star} star`}
                  >
                    â˜…
                  </button>
                );
              })}
            </div>
            {reviewError && <div className="text-red-500 text-sm mt-2 text-center">{reviewError}</div>}

            <div className="mt-6">
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Share your experience..."
                rows={4}
                maxLength={500}
                className="border border-[#E0E0E0] rounded-lg p-3 w-full outline-none focus:border-wyzant-teal focus:ring-2 focus:ring-wyzant-teal/20"
              />
              <div className="text-[#6C757D] text-sm mt-1 text-right">{reviewComment.length}/500</div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setReviewOpen(false);
                  setReviewBooking(null);
                }}
                className="border border-[#E0E0E0] px-8 py-3 rounded-lg font-semibold hover:bg-[#F8F9FA] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reviewSubmitting}
                onClick={submitReview}
                className={`bg-wyzant-teal text-white px-8 py-3 rounded-lg font-semibold hover:bg-wyzant-teal-dark transition ${
                  reviewSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyBookingsPage;



``


## client/src/pages/AdminDashboard.jsx

``jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/auth/session', { withCredentials: true })
      .then(res => {
        if (res.data.user.role !== 'admin') {
          alert('Access denied: Admins only.');
          navigate('/');
        } else {
          setUser(res.data.user);
          axios
            .get('http://localhost:5000/api/admin/stats')
            .then(response => setStats(response.data))
            .catch(err => console.error('Error fetching stats:', err));
        }
      })
      .catch(() => {
        alert('Please log in first.');
        navigate('/');
      });
  }, [navigate]);

  const handleLogout = async () => {
    await axios.get('http://localhost:5000/api/auth/logout', { withCredentials: true });
    navigate('/');
  };

  const monthlyBookings = [
    { month: 'Jan', bookings: 12 },
    { month: 'Feb', bookings: 19 },
    { month: 'Mar', bookings: 25 },
    { month: 'Apr', bookings: 18 },
    { month: 'May', bookings: 30 },
    { month: 'Jun', bookings: 28 }
  ];

  const subjectPopularity = [
    { subject: 'Math', count: 45 },
    { subject: 'Science', count: 30 },
    { subject: 'IT', count: 38 },
    { subject: 'English', count: 22 },
    { subject: 'Other', count: 15 }
  ];

  const formatToday = () =>
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' });

  const generateReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18).text('PeerWise Admin Report', 14, 22);
    doc.setFontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const columns = ['Metric', 'Value'];
    const rows = [
      ['Total Revenue', stats?.revenue ? `Rs. ${stats.revenue}` : 'Rs. 0'],
      ['Total Tutors', stats?.totalTutors ?? '-'],
      ['Total Students', stats?.totalStudents ?? '-'],
      ['Total Bookings', stats?.totalBookings ?? '-'],
      ['Total Subjects', stats?.totalSubjects ?? '-']
    ];

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [74, 144, 217] }
    });

    doc.save(`PeerWise_Admin_Report_${Date.now()}.pdf`);
  };

  const pathname = window.location.pathname;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {user ? (
        <>
          {/* Top Admin Navbar */}
          <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#2C3E50] shadow-md">
            <div className="h-full max-w-[1400px] mx-auto px-6 flex items-center justify-between">
              <div className="text-white font-bold text-xl">PeerWise Admin</div>
              <div className="flex items-center gap-4">
                <div className="text-white font-semibold">ðŸ‘¤ {user.username}</div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white rounded-lg px-4 py-2 font-semibold hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Sidebar + Main */}
          <div className="pt-16 flex">
            {/* Sidebar */}
            <aside className="fixed top-16 left-0 bottom-0 w-[250px] bg-[#2C3E50] text-white px-3 py-6">
              <div className="space-y-2">
                {[
                  { label: 'Dashboard', icon: 'ðŸ ', path: '/admin-dashboard' },
                  { label: 'Tutor Manager', icon: 'ðŸ§‘â€ðŸ«', path: '/tutor-manager' },
                  { label: 'Student Manager', icon: 'ðŸ‘¨â€ðŸŽ“', path: '/student-manager' },
                  { label: 'Booking Manager', icon: 'ðŸ“…', path: '/booking-manager' },
                  { label: 'Subject Manager', icon: 'ðŸ“š', path: '/subject-manager' },
                  { label: 'Reviews', icon: 'â­', path: '/reviews-manager' }
                ].map(item => {
                  const active = pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition rounded-lg ${
                        active ? 'bg-[#4A90D9]' : 'hover:bg-white/10'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 ml-[250px] px-6 py-8">
              {/* Header Row */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-8">
                <div className="text-[#2C3E50] text-2xl font-bold">
                  Welcome back, {user.username}! ðŸ‘‹
                </div>
                <div className="text-[#6C757D] font-semibold">{formatToday()}</div>
              </div>

              {/* Stats Cards */}
              {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  {[
                    {
                      label: 'Total Tutors',
                      value: stats.totalTutors,
                      icon: 'ðŸ§‘â€ðŸ«',
                      iconBg: 'bg-[#EBF5FB]',
                      trend: '+12% this month',
                      trendClass: 'text-green-500'
                    },
                    {
                      label: 'Total Students',
                      value: stats.totalStudents,
                      icon: 'ðŸ‘¨â€ðŸŽ“',
                      iconBg: 'bg-green-50',
                      trend: '+8% this month',
                      trendClass: 'text-green-500'
                    },
                    {
                      label: 'Total Bookings',
                      value: stats.totalBookings,
                      icon: 'ðŸ“…',
                      iconBg: 'bg-yellow-50',
                      trend: '+5% this month',
                      trendClass: 'text-green-500'
                    },
                    {
                      label: 'Total Revenue',
                      value: `Rs. ${stats.revenue || 0}`,
                      icon: 'ðŸ’°',
                      iconBg: 'bg-green-100',
                      trend: '+18% this month',
                      trendClass: 'text-green-600'
                    }
                  ].map(card => (
                    <div
                      key={card.label}
                      className="bg-white border border-[#E0E0E0] rounded-xl shadow-sm p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[#6C757D] font-semibold text-sm">{card.label}</div>
                          <div className="text-3xl font-bold text-[#2C3E50] mt-1">{card.value}</div>
                          <div className={`${card.trendClass} text-sm font-semibold mt-2`}>{card.trend}</div>
                        </div>
                        <div className={`rounded-full p-3 ${card.iconBg}`}>
                          <span className="text-2xl">{card.icon}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] p-6">
                  <div className="text-[#2C3E50] font-bold text-lg mb-4">Monthly Bookings</div>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyBookings}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="bookings" fill="#4A90D9" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] p-6">
                  <div className="text-[#2C3E50] font-bold text-lg mb-4">Popular Subjects</div>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectPopularity}>
                        <XAxis dataKey="subject" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#F5A623" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Management Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {[
                  {
                    icon: 'ðŸ§‘â€ðŸ«',
                    title: 'Tutor Management',
                    desc: 'Manage tutor profiles, subjects and availability',
                    path: '/tutor-manager',
                    border: 'border-l-4 border-[#4A90D9]'
                  },
                  {
                    icon: 'ðŸ‘¨â€ðŸŽ“',
                    title: 'Student Management',
                    desc: 'Manage student profiles and enrollments',
                    path: '/student-manager',
                    border: 'border-l-4 border-green-500'
                  },
                  {
                    icon: 'ðŸ“…',
                    title: 'Booking Management',
                    desc: 'View and manage all tutoring sessions',
                    path: '/booking-manager',
                    border: 'border-l-4 border-yellow-500'
                  },
                  {
                    icon: 'ðŸ“š',
                    title: 'Subject Management',
                    desc: 'Manage available subjects and categories',
                    path: '/subject-manager',
                    border: 'border-l-4 border-purple-500'
                  }
                ].map(item => (
                  <div
                    key={item.title}
                    onClick={() => navigate(item.path)}
                    className={`cursor-pointer bg-white border border-[#E0E0E0] rounded-xl shadow-sm p-6 hover:shadow-md transition ${item.border}`}
                  >
                    <div className="text-3xl">{item.icon}</div>
                    <div className="text-[#2C3E50] font-bold text-xl mt-3">{item.title}</div>
                    <div className="text-[#6C757D] mt-2">{item.desc}</div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] p-6">
                <div className="text-[#2C3E50] font-bold text-xl mb-6">Quick Actions</div>
                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    onClick={() => navigate('/tutors')}
                    className="bg-[#4A90D9] text-white rounded-lg px-6 py-3 font-semibold hover:bg-[#2C6FAC] transition"
                  >
                    ðŸ§‘â€ðŸ« View All Tutors
                  </button>
                  <button
                    onClick={() => navigate('/booking-manager')}
                    className="bg-white border border-[#4A90D9] text-[#4A90D9] rounded-lg px-6 py-3 font-semibold hover:bg-[#EBF5FB] transition"
                  >
                    ðŸ“… View All Bookings
                  </button>
                  <button
                    onClick={generateReport}
                    className="bg-white border border-[#E0E0E0] text-[#6C757D] rounded-lg px-6 py-3 font-semibold hover:bg-[#F8F9FA] transition"
                  >
                    ðŸ“Š Generate Report
                  </button>
                </div>
              </div>
            </main>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center min-h-screen bg-[#F8F9FA]">
          <p className="text-[#2C3E50] font-semibold text-x2">Loading admin info...</p>
        </div>

      )}
    </div>
  );
}

export default AdminDashboard;


``

