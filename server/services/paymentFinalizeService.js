const fs = require('fs').promises;
const path = require('path');
const Invoice = require('../models/Invoice');
const { buildInvoicePdfBuffer } = require('../utils/invoicePdf');
const { sendInvoiceEmail } = require('../utils/emailService');

function invoiceNumberFromPayment(payment) {
  return `INV-${payment._id.toString().slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Writes PDF, creates Invoice row, emails student. Idempotent if invoice exists.
 * @returns {Promise<{ invoice: import('mongoose').Document, buffer: Buffer }>}
 */
async function finalizeInvoiceForPayment(payment, user) {
  const existing = await Invoice.findOne({ paymentId: payment._id });
  if (existing) {
    const abs = path.join(__dirname, '..', 'uploads', existing.pdfRelativePath);
    const buffer = await fs.readFile(abs).catch(() => null);
    return { invoice: existing, buffer };
  }

  const invoiceNumber = invoiceNumberFromPayment(payment);
  const filename = `${invoiceNumber}.pdf`;
  const absDir = path.join(__dirname, '..', 'uploads', 'invoices');
  const absFile = path.join(absDir, filename);
  await fs.mkdir(absDir, { recursive: true });

  const lineDescription =
    payment.kind === 'subscription'
      ? `Subscription — ${payment.moduleName || 'Plan'}`
      : payment.moduleName || 'Module payment';

  const buffer = await buildInvoicePdfBuffer({
    invoiceNumber,
    studentName: user.username,
    studentEmail: user.email,
    lineDescription,
    amount: payment.amount,
    originalAmount: payment.originalAmount,
    discountAmount: payment.discountAmount || 0,
    promoCode: payment.promoCode,
    paymentMethod: payment.paymentMethod,
    paidAt: payment.updatedAt || payment.createdAt || new Date(),
    enrollmentReference: payment.enrollmentReference,
  });

  await fs.writeFile(absFile, buffer);

  const invoice = await Invoice.create({
    paymentId: payment._id,
    invoiceNumber,
    pdfRelativePath: `invoices/${filename}`,
  });

  try {
    await sendInvoiceEmail(user.email, user.username, buffer, filename, {
      moduleName: lineDescription,
      amount: payment.amount,
      invoiceNumber,
    });
    invoice.emailSent = true;
    invoice.emailSentAt = new Date();
    await invoice.save();
  } catch (e) {
    invoice.emailError = e.message;
    await invoice.save();
    console.error('Invoice email failed:', e.message);
  }

  return { invoice, buffer };
}

module.exports = { finalizeInvoiceForPayment, invoiceNumberFromPayment };
