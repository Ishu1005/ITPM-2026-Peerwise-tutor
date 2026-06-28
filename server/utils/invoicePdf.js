const PDFDocument = require('pdfkit');

/**
 * @param {object} data
 * @returns {Promise<Buffer>}
 */
function buildInvoicePdfBuffer(data) {
  const {
    invoiceNumber,
    studentName,
    studentEmail,
    lineDescription,
    amount,
    originalAmount,
    discountAmount,
    promoCode,
    paymentMethod,
    paidAt,
    enrollmentReference,
  } = data;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('PeerWise — Invoice', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    doc.text(`Invoice #: ${invoiceNumber}`);
    doc.text(`Date: ${paidAt.toISOString().slice(0, 10)}`);
    doc.moveDown();
    doc.text(`Bill to: ${studentName}`);
    doc.text(`Email: ${studentEmail}`);
    doc.moveDown();
    doc.text(`Item: ${lineDescription}`);
    if (enrollmentReference) doc.text(`Enrollment ref: ${enrollmentReference}`);
    doc.moveDown();
    doc.text(`Original: Rs. ${Number(originalAmount).toFixed(2)}`);
    if (discountAmount > 0) {
      doc.text(
        `Discount: Rs. ${Number(discountAmount).toFixed(2)}${promoCode ? ` (promo ${promoCode})` : ''}`
      );
    }
    doc.fontSize(12).text(`Total paid: Rs. ${Number(amount).toFixed(2)}`);
    doc.fontSize(10).text(`Payment method: ${paymentMethod === 'slip' ? 'Bank slip' : 'Card'}`);
    doc.moveDown(2);
    doc.fontSize(9).text('Thank you for choosing PeerWise.', { align: 'center' });
    doc.end();
  });
}

module.exports = { buildInvoicePdfBuffer };
