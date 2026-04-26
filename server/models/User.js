const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true },
  password: { type: String, required: true },
  phoneNumber: { type: String }, // New field
  university: { type: String },  // New field
  role:     { type: String, enum: ['admin', 'student', 'tutor'], default: 'student' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);