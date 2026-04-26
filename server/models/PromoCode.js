const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percent', 'fixed'], required: true },
    discountValue: { type: Number, required: true },
    validFrom: { type: Date, default: () => new Date() },
    validUntil: { type: Date },
    maxUses: { type: Number, default: 10000 },
    usedCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    applicableModuleIds: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('PromoCode', promoCodeSchema);
