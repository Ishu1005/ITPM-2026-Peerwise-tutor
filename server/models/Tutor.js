const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  profileImage: { type: String, default: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' },
  subjects: [String],
  hourlyRate: { type: Number, required: true },
  rating: { type: Number, default: 4.8 },
  ratingCount: { type: Number, default: 0 },
  responseTime: { type: String, default: '1 hour' },
  bio: String,
  experience: { type: Number, default: 2 },
  education: String,
  location: { type: String, default: 'Online' },
  availability: [{ day: String, startTime: String, endTime: String }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Tutor', tutorSchema);
