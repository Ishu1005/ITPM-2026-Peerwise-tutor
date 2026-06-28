const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Feedback = require('../models/Feedback');
const FeedbackReport = require('../models/FeedbackReport');
const Student = require('../models/Student');
const User = require('../models/User');

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

exports.createFeedback = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { session_id, module, moduleLabel, rating, comment } = req.body;
    const text = typeof comment === 'string' ? comment.trim() : '';

    if (rating === undefined || rating === null || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5.' });
    }

    let student;
    try {
      student = await ensureStudent(userId);
    } catch (e) {
      return res.status(400).json({ msg: e.message || 'Could not load student profile.' });
    }

    const hasSession =
      session_id && mongoose.Types.ObjectId.isValid(String(session_id));

    if (hasSession) {
      const booking = await Booking.findById(session_id);
      if (!booking) {
        return res.status(404).json({ msg: 'Session not found.' });
      }
      if (booking.status !== 'completed') {
        return res.status(400).json({ msg: 'Feedback is only allowed for completed sessions.' });
      }
      if (booking.studentId.toString() !== student._id.toString()) {
        return res.status(403).json({ msg: 'You can only leave feedback for sessions you attended.' });
      }

      const existing = await Feedback.findOne({ studentId: student._id, sessionId: session_id });
      if (existing) {
        return res.status(409).json({ msg: 'You have already submitted feedback for this session.' });
      }

      const doc = await Feedback.create({
        sessionId: session_id,
        moduleLabel: '',
        studentId: student._id,
        userId,
        rating: Number(rating),
        comment: text
      });

      const populated = await Feedback.findById(doc._id)
        .populate({
          path: 'sessionId',
          select: 'subject date startTime endTime',
          populate: { path: 'tutorId', select: 'fullName' }
        })
        .lean();

      return res.status(201).json(populated);
    }

    const label = String(moduleLabel || module || '')
      .trim()
      .slice(0, 200);
    if (!label) {
      return res.status(400).json({
        msg: 'Choose or enter a module (e.g. Java, React), or link a completed session.'
      });
    }

    const doc = await Feedback.create({
      studentId: student._id,
      userId,
      rating: Number(rating),
      comment: text,
      moduleLabel: label
    });

    const populated = await Feedback.findById(doc._id).lean();
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ msg: 'You have already submitted feedback for this session.' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.listFeedback = async (req, res) => {
  try {
    const list = await Feedback.find({ is_flagged: false })
      .sort({ createdAt: -1 })
      .populate({
        path: 'sessionId',
        select: 'subject date startTime endTime',
        populate: { path: 'tutorId', select: 'fullName' }
      })
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** Public aggregates for dashboard chart (non-flagged only) */
exports.getFeedbackStats = async (req, res) => {
  try {
    const match = { is_flagged: false };
    const byRating = await Feedback.aggregate([
      { $match: match },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const summary = await Feedback.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    byRating.forEach(row => {
      const k = row._id;
      if (k >= 1 && k <= 5) distribution[k] = row.count;
    });

    const s = summary[0] || { total: 0, averageRating: 0 };
    res.json({
      total: s.total || 0,
      averageRating: s.averageRating != null ? Math.round(s.averageRating * 10) / 10 : 0,
      distribution
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reportFeedback = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { feedback_id, reason } = req.body;
    const allowed = ['spam', 'offensive', 'irrelevant', 'other'];

    if (!feedback_id || !mongoose.Types.ObjectId.isValid(feedback_id)) {
      return res.status(400).json({ msg: 'Valid feedback_id is required.' });
    }
    if (!reason || !allowed.includes(reason)) {
      return res.status(400).json({ msg: 'Invalid or missing reason. Choose: spam, offensive, irrelevant, other.' });
    }

    const fb = await Feedback.findById(feedback_id);
    if (!fb) {
      return res.status(404).json({ msg: 'Feedback not found.' });
    }

    await FeedbackReport.create({
      feedback_id,
      reported_by: userId,
      reason
    });

    fb.is_flagged = true;
    await fb.save();

    res.status(201).json({ msg: 'Report submitted. This feedback has been flagged for review.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReportedFeedback = async (req, res) => {
  try {
    const reports = await FeedbackReport.find({})
      .sort({ createdAt: -1 })
      .populate({
        path: 'feedback_id',
        populate: {
          path: 'sessionId',
          select: 'subject date',
          populate: { path: 'tutorId', select: 'fullName' }
        }
      })
      .populate('reported_by', 'username email')
      .lean();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
