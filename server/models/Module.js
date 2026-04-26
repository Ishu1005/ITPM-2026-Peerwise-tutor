const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    code: { type: String, default: '' },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LearningModule', moduleSchema);
