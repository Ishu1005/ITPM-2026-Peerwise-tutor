const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { finalizeInvoiceForPayment } = require('../services/paymentFinalizeService');

const PLANS = [
  { planId: 'PLAN-MONTH-BASIC', planName: 'Monthly Tutoring Pass', intervalMonths: 1, pricePerCycle: 12000 },
  { planId: 'PLAN-MONTH-PRO', planName: 'Monthly Pro (3 modules)', intervalMonths: 1, pricePerCycle: 25000 },
];

async function processDueRenewals(userId) {
  const now = new Date();
  const subs = await Subscription.find({ userId, status: 'active', nextBillingDate: { $lte: now } });
  if (!subs.length) return;
  const user = await User.findById(userId);
  if (!user) return;
  for (const sub of subs) {
    const pay = await Payment.create({
      userId,
      kind: 'subscription',
      moduleId: sub.planId,
      moduleName: sub.planName + ' (renewal ' + (sub.renewalCount + 1) + ')',
      originalAmount: sub.pricePerCycle,
      discountAmount: 0,
      amount: sub.pricePerCycle,
      status: 'success',
      paymentMethod: sub.paymentMethod,
      subscriptionId: sub._id,
      gatewayTransactionId: 'renew_' + Date.now() + '_' + sub._id,
    });
    await finalizeInvoiceForPayment(pay, user);
    sub.renewalCount += 1;
    const next = new Date(sub.nextBillingDate);
    next.setMonth(next.getMonth() + sub.intervalMonths);
    sub.nextBillingDate = next;
    sub.endDate = next;
    sub.lastPaymentId = pay._id;
    await sub.save();
  }
}

exports.listPlans = (req, res) => {
  res.json(PLANS);
};

exports.subscribe = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const planId = req.body.planId;
    const paymentMethod = req.body.paymentMethod;
    const plan = PLANS.find(p => p.planId === planId);
    if (!plan) return res.status(400).json({ error: 'Unknown plan' });
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + plan.intervalMonths);
    const pm = paymentMethod === 'slip' ? 'slip' : 'card';
    const payment = await Payment.create({
      userId,
      kind: 'subscription',
      moduleId: plan.planId,
      moduleName: plan.planName,
      originalAmount: plan.pricePerCycle,
      discountAmount: 0,
      amount: plan.pricePerCycle,
      status: 'success',
      paymentMethod: pm,
      gatewayTransactionId: 'sub_' + Date.now(),
    });
    const sub = await Subscription.create({
      userId,
      planId: plan.planId,
      planName: plan.planName,
      intervalMonths: plan.intervalMonths,
      pricePerCycle: plan.pricePerCycle,
      startDate: now,
      endDate: periodEnd,
      nextBillingDate: periodEnd,
      status: 'active',
      renewalCount: 0,
      lastPaymentId: payment._id,
      paymentMethod: pm,
    });
    payment.subscriptionId = sub._id;
    await payment.save();
    const user = await User.findById(userId);
    const { invoice } = await finalizeInvoiceForPayment(payment, user);
    res.status(201).json({
      subscription: sub,
      payment,
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        downloadPath: '/api/payments/invoice/' + invoice.invoiceNumber + '/pdf',
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

exports.mySubscriptions = async (req, res) => {
  try {
    const userId = req.session.user.id;
    await processDueRenewals(userId);
    const list = await Subscription.find({ userId }).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const sub = await Subscription.findOne({ _id: req.params.id, userId });
    if (!sub) return res.status(404).json({ error: 'Not found' });
    sub.status = 'cancelled';
    await sub.save();
    res.json({ ok: true, subscription: sub });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
