const path = require('path');
const fs = require('fs').promises;
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const PromoCode = require('../models/PromoCode');
const User = require('../models/User');
const catalog = require('../config/moduleCatalog');
const { finalizeInvoiceForPayment } = require('../services/paymentFinalizeService');

async function computePromoDiscount(code, moduleId, baseAmount) {
  if (!code || !String(code).trim()) return { discount: 0, promo: null };
  const promo = await PromoCode.findOne({ code: String(code).toUpperCase().trim() });
  if (!promo || !promo.active) throw new Error('Invalid promo code');
  const now = new Date();
  if (promo.validFrom && now < promo.validFrom) throw new Error('Promo not yet active');
  if (promo.validUntil && now > promo.validUntil) throw new Error('Promo expired');
  if (promo.usedCount >= promo.maxUses) throw new Error('Promo usage limit reached');
  const ids = promo.applicableModuleIds || [];
  if (ids.length && !ids.includes(moduleId)) throw new Error('Promo not valid for this module');
  let discount = 0;
  if (promo.discountType === 'percent') {
    discount = Math.floor((baseAmount * promo.discountValue) / 100);
  } else {
    discount = Math.min(promo.discountValue, baseAmount);
  }
  return { discount, promo };
}

exports.listModules = (req, res) => {
  res.json(catalog.listModules());
};

exports.validatePromo = async (req, res) => {
  try {
    const { code, moduleId } = req.body;
    if (!code || !String(code).trim()) {
      return res.status(400).json({ valid: false, error: 'Promo code is required' });
    }
    const mod = catalog.getModule(moduleId);
    if (!mod) return res.status(400).json({ valid: false, error: 'Unknown module' });
    const baseAmount = mod.price;
    const r = await computePromoDiscount(code, moduleId, baseAmount);
    res.json({
      valid: true,
      discountAmount: r.discount,
      finalAmount: baseAmount - r.discount,
      originalAmount: baseAmount,
    });
  } catch (e) {
    res.status(400).json({ valid: false, error: e.message });
  }
};

exports.checkout = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { moduleId, paymentMethod, promoCode, enrollmentReference, cameraMode, cardNumber } = req.body;
    const mod = catalog.getModule(moduleId);
    if (!mod) return res.status(400).json({ error: 'Unknown module' });
    const slipFile = req.file;
    const cameraOn = cameraMode === 'true' || cameraMode === true;
    if (paymentMethod === 'slip' && !slipFile && !cameraOn) {
      return res.status(400).json({ error: 'Bank slip file required unless using camera capture mode' });
    }
    const baseAmount = mod.price;
    let discount = 0;
    let promoDoc = null;
    if (promoCode) {
      try {
        const r = await computePromoDiscount(promoCode, moduleId, baseAmount);
        discount = r.discount;
        promoDoc = r.promo;
      } catch (e) {
        return res.status(400).json({ error: e.message });
      }
    }
    const finalAmount = Math.max(0, baseAmount - discount);
    const cleanCard = cardNumber ? String(cardNumber).replace(/\s/g, '') : '';
    const mockDecline = paymentMethod === 'card' && cleanCard.endsWith('0000');
    const status = mockDecline ? 'failed' : 'success';
    let slipPath;
    if (slipFile) {
      slipPath = 'slips/' + path.basename(slipFile.path);
    } else if (paymentMethod === 'slip' && cameraOn) {
      const fname = 'camera-' + Date.now() + '.txt';
      const slipAbs = path.join(__dirname, '..', 'uploads', 'slips', fname);
      await fs.mkdir(path.dirname(slipAbs), { recursive: true });
      await fs.writeFile(slipAbs, 'PeerWise camera slip capture (demo placeholder)');
      slipPath = 'slips/' + fname;
    }
    const payment = await Payment.create({
      userId,
      kind: 'module',
      moduleId,
      moduleName: mod.name,
      originalAmount: baseAmount,
      discountAmount: discount,
      amount: finalAmount,
      promoCode: promoDoc ? promoDoc.code : promoCode ? String(promoCode).toUpperCase() : undefined,
      status,
      paymentMethod,
      enrollmentReference: enrollmentReference || undefined,
      slipFilePath: slipPath,
      cameraSlipMode: Boolean(cameraOn && !slipFile),
      gatewayTransactionId: status === 'success' ? 'gw_' + Date.now() : undefined,
      failureReason: mockDecline ? 'Card declined (test: card number ending in 0000)' : undefined,
    });
    if (status === 'success' && promoDoc) {
      await PromoCode.updateOne({ _id: promoDoc._id }, { $inc: { usedCount: 1 } });
    }
    if (status === 'failed') {
      return res.status(402).json({ success: false, error: payment.failureReason, payment });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: 'User not found' });
    const { invoice } = await finalizeInvoiceForPayment(payment, user);
    res.status(201).json({
      success: true,
      payment,
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        downloadPath: '/api/payments/invoice/' + invoice.invoiceNumber + '/pdf',
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.history = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const payments = await Payment.find({ userId }).sort({ createdAt: -1 }).lean();
    const ids = payments.map(p => p._id);
    const invoices = await Invoice.find({ paymentId: { $in: ids } }).lean();
    const invByPay = {};
    invoices.forEach(i => {
      invByPay[String(i.paymentId)] = i;
    });
    const rows = payments.map(p => Object.assign({}, p, { invoice: invByPay[String(p._id)] || null }));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.downloadInvoicePdf = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const invoiceNumber = req.params.invoiceNumber;
    const inv = await Invoice.findOne({ invoiceNumber });
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    const payment = await Payment.findById(inv.paymentId);
    if (!payment || String(payment.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const abs = path.join(__dirname, '..', 'uploads', inv.pdfRelativePath);
    res.download(abs, invoiceNumber + '.pdf');
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.seedPromosIfEmpty = async () => {
  try {
    const n = await PromoCode.countDocuments();
    if (n > 0) return;
    await PromoCode.insertMany([
      { code: 'WELCOME10', discountType: 'percent', discountValue: 10, active: true, applicableModuleIds: [] },
      { code: 'SAVE500', discountType: 'fixed', discountValue: 500, active: true, applicableModuleIds: [] },
    ]);
    console.log('Seeded default promo codes: WELCOME10, SAVE500');
  } catch (e) {
    console.warn('Promo seed skipped:', e.message);
  }
};
