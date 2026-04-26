const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['Mathematics', 'Science', 'Language', 'IT', 'Other'] },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] }
});

module.exports = mongoose.model('Subject', subjectSchema);
