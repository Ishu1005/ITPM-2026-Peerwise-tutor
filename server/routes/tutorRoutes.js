const express = require('express');
const router = express.Router();
const {
  createTutor,
  getTutors,
  getTutorById,
  updateTutor,
  deleteTutor,
  getMyProfile,
  updateMyProfile,
  getBookedSlots
} = require('../controllers/tutorController');

const auth = require('../middleware/authMiddleware');

router.get('/me', auth, getMyProfile);
router.put('/me', auth, updateMyProfile);
router.get('/:id/booked-slots', getBookedSlots);

router.get('/', getTutors);
router.get('/:id', getTutorById);
router.post('/', auth, createTutor);
router.put('/:id', auth, updateTutor);
router.delete('/:id', auth, deleteTutor);

module.exports = router;
