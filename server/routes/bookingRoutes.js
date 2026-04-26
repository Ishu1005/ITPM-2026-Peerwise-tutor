const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  createBooking,
  getBookingsForUser,
  getAllBookings,
  updateBooking,
  updateStatus,
  deleteBooking
} = require('../controllers/bookingController');

router.post('/', auth, createBooking);
router.get('/student/:userId', auth, getBookingsForUser);
router.patch('/:id/status', auth, updateStatus);
router.get('/', auth, getAllBookings);
router.put('/:id', auth, updateBooking);
router.delete('/:id', auth, deleteBooking);

module.exports = router;
