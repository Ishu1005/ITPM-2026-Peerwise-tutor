const express = require('express');
const router = express.Router();
const { createTutorRequest } = require('../controllers/tutorRequestController');

// All tutor request routes require authentication
router.post('/', createTutorRequest);

module.exports = router;
