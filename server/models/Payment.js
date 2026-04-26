const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['module', 'subscription'], default: 'module' },
    moduleId: { type: String },
    moduleName: { type: String },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
    originalAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'LKR' },
    promoCode: { type: String, uppercase: true, trim: true },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending', index: true },
    paymentMethod: { type: String, enum: ['card', 'slip'], required: true },
    enrollmentReference: { type: String },
    slipFilePath: { type: String },
    cameraSlipMode: { type: Boolean, default: false },
    gatewayTransactionId: { type: String },
    gatewayPayload: { type: mongoose.Schema.Types.Mixed },
    failureReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
