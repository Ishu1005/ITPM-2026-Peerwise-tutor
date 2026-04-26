const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    intervalMonths: { type: Number, required: true, default: 1 },
    pricePerCycle: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    nextBillingDate: { type: Date, required: true, index: true },
    status: { type: String, enum: ['active', 'cancelled'], default: 'active', index: true },
    renewalCount: { type: Number, default: 0 },
    lastPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    paymentMethod: { type: String, enum: ['card', 'slip'], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
