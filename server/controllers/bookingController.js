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
