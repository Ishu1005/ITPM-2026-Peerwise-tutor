const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { createReview, getReviewsForTutor } = require('../controllers/reviewController');

router.post('/', auth, createReview);
router.get('/tutor/:id', getReviewsForTutor);

module.exports = router;
