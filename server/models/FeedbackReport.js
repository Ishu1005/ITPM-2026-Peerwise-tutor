const mongoose = require('mongoose');

const feedbackReportSchema = new mongoose.Schema(
  {
    feedback_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback', required: true },
    reported_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: {
      type: String,
      required: true,
      enum: ['spam', 'offensive', 'irrelevant', 'other']
    }
  },
  { timestamps: true, collection: 'reports' }
);

module.exports = mongoose.model('FeedbackReport', feedbackReportSchema);
