const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const requireStudent = require('../middleware/requireStudent');
const {
  createFeedback,
  listFeedback,
  getFeedbackStats,
  reportFeedback,
  getReportedFeedback
} = require('../controllers/feedbackController');

router.get('/feedback/stats', getFeedbackStats);
router.post('/feedback', auth, requireStudent, createFeedback);
router.get('/feedback', listFeedback);
router.post('/report-feedback', auth, reportFeedback);
router.get('/reported-feedback', auth, isAdmin, getReportedFeedback);

module.exports = router;
