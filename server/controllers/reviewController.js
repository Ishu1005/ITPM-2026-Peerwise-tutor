const Review = require('../models/Review');
const Tutor = require('../models/Tutor');

exports.createReview = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { tutorId, bookingId, rating, comment } = req.body;
    
    // Create the review
    const review = await Review.create({
      tutorId,
      bookingId,
      userId,
      rating,
      comment: comment || ''
    });

    // Calculate new average rating
    const allReviews = await Review.find({ tutorId });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    // Update Tutor model
    await Tutor.findByIdAndUpdate(tutorId, {
      rating: parseFloat(avg.toFixed(1)),
      reviewCount: allReviews.length
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReviewsForTutor = async (req, res) => {
  try {
    const reviews = await Review.find({ tutorId: req.params.id })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .lean();
    const mapped = reviews.map(r => ({
      ...r,
      studentName: r.userId?.username || 'Student'
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

