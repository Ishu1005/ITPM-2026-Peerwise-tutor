const nodemailer = require('nodemailer');

let testAccount = null;
let transporter = null;

// Initialize an ethereal transporter or use a real one if env vars exist
async function initTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate test Ethereal account
    testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('✉️ Initialized Ethereal Email Transporter for development.');
    console.log(`Credentials: ${testAccount.user} / ${testAccount.pass}`);
  }
  return transporter;
}

exports.sendBookingEmailToTutor = async (tutorEmail, studentName, date, time) => {
  try {
    const tp = await initTransporter();
    const info = await tp.sendMail({
      from: '"PeerWise System" <no-reply@peerwise.local>',
      to: tutorEmail,
      subject: '📅 New Booking Request Received!',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>New Booking Request</h2>
          <p>Hello! You have received a new booking request from <strong>${studentName}</strong>.</p>
          <p><strong>Date:</strong> ${new Date(date).toDateString()}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p>Please log in to your dashboard to confirm or reject this booking.</p>
          <br/>
          <p>Thanks,<br/>The PeerWise Team</p>
        </div>
      `,
    });
    console.log('✅ Email sent to Tutor: %s', info.messageId);
    if (testAccount) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Failed to send email to tutor:', error);
  }
};

exports.sendConfirmationToStudent = async (studentEmail, tutorName, date, time) => {
  try {
    const tp = await initTransporter();
    const info = await tp.sendMail({
      from: '"PeerWise System" <no-reply@peerwise.local>',
      to: studentEmail,
      subject: '✅ Your Session is Confirmed!',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Session Confirmed</h2>
          <p>Great news! Your booking with <strong>${tutorName}</strong> has been confirmed.</p>
          <p><strong>Date:</strong> ${new Date(date).toDateString()}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p>Get ready for an awesome learning experience.</p>
          <br/>
          <p>Thanks,<br/>The PeerWise Team</p>
        </div>
      `,
    });
    console.log('✅ Email sent to Student: %s', info.messageId);
    if (testAccount) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Failed to send email to student:', error);
  }
};

exports.sendInvoiceEmail = async (toEmail, studentName, pdfBuffer, filename, meta) => {
  const tp = await initTransporter();
  const info = await tp.sendMail({
    from: '"PeerWise Billing" <no-reply@peerwise.local>',
    to: toEmail,
    subject: `PeerWise invoice ${meta.invoiceNumber} - ${meta.moduleName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Payment receipt</h2>
        <p>Hi ${studentName},</p>
        <p>Thank you for your payment. Invoice <strong>${meta.invoiceNumber}</strong> is attached.</p>
        <p><strong>Item:</strong> ${meta.moduleName}<br/>
        <strong>Amount:</strong> Rs. ${Number(meta.amount).toFixed(2)}</p>
        <p>You can also download it from Payment History in your account.</p>
        <p>PeerWise</p>
      </div>
    `,
    attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
  });
  const out = { messageId: info.messageId };
  if (testAccount) {
    out.previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('Invoice email preview: %s', out.previewUrl);
  }
  return out;
};
