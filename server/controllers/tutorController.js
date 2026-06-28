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
    // Fetch active tutors. (Hourly rate can be 0 for new tutors until they update their profile.)
    const query = { isActive: true, hourlyRate: { $gte: 0 } };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    if (subject) {
      // Subjects is an array of strings; use case-insensitive match so "Java" and "JAVA" both work.
      query.subjects = { $regex: String(subject).trim(), $options: 'i' };
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
