const mongoose = require('mongoose');

const tutorRequestSchema = new mongoose.Schema({
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', required: true },
  studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  preferredDate: { type: Date },
  preferredTime: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  flowMode: { type: String, enum: ['search', 'request', 'online'], default: 'search' }
}, { timestamps: true });

module.exports = mongoose.model('TutorRequest', tutorRequestSchema);
