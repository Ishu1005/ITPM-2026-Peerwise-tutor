const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: false },
    /** When feedback is not tied to a booking — e.g. module experience */
    moduleLabel: { type: String, default: '' },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    is_flagged: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// One feedback per student per completed session (only when sessionId is set)
feedbackSchema.index(
  { studentId: 1, sessionId: 1 },
  {
    unique: true,
    partialFilterExpression: { sessionId: { $exists: true, $ne: null } }
  }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
