const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
  paymentMethod: { type: String, default: 'mock_card' },
  receiptUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
