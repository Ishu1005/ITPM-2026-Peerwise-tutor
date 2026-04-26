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
