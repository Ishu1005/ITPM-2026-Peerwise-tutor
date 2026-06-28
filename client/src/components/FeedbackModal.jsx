import React from 'react';

function FeedbackModal({ 
  reviewOpen, 
  setReviewOpen, 
  reviewBooking, 
  setReviewBooking, 
  reviewRating, 
  setReviewRating, 
  reviewError, 
  setReviewError, 
  reviewComment, 
  setReviewComment, 
  submitReview, 
  reviewSubmitting 
}) {
  if (!reviewOpen) return null;

  const tutorObj = typeof reviewBooking?.tutorId === 'object' ? reviewBooking.tutorId : reviewBooking?.tutor;
  const tutorName = tutorObj?.fullName || reviewBooking?.tutorName || 'Tutor';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto w-full">
        <div className="text-[#2C3E50] font-bold text-xl">Rate Your Session</div>
        <div className="text-[#6C757D] mt-1">{tutorName}</div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => {
            const star = i + 1;
            const selected = reviewRating >= star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => { setReviewRating(star); setReviewError(''); }}
                className={`text-4xl ${selected ? 'text-[#F5A623]' : 'text-gray-300'} transition-transform hover:scale-105`}
                aria-label={`Rate ${star} star`}
              >
                ★
              </button>
            );
          })}
        </div>
        {reviewError && <div className="text-red-500 text-sm mt-2 text-center">{reviewError}</div>}

        <div className="mt-6">
          <textarea
            value={reviewComment}
            onChange={e => setReviewComment(e.target.value)}
            placeholder="Share your experience..."
            rows={4}
            maxLength={500}
            className="border border-[#E0E0E0] rounded-lg p-3 w-full outline-none focus:border-wyzant-teal focus:ring-2 focus:ring-wyzant-teal/20"
          />
          <div className="text-[#6C757D] text-sm mt-1 text-right">{reviewComment.length}/500</div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => { setReviewOpen(false); setReviewBooking(null); }}
            className="border border-[#E0E0E0] px-8 py-3 rounded-lg font-semibold hover:bg-[#F8F9FA] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={reviewSubmitting}
            onClick={submitReview}
            className={`bg-wyzant-teal text-white px-8 py-3 rounded-lg font-semibold hover:bg-wyzant-teal-dark transition ${
              reviewSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeedbackModal;
