const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');
const requireStudent = require('../middleware/requireStudent');
const paymentController = require('../controllers/paymentController');

const slipDir = path.join(__dirname, '..', 'uploads', 'slips');
if (!fs.existsSync(slipDir)) {
  fs.mkdirSync(slipDir, { recursive: true });
}

const upload = multer({
  dest: slipDir,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok =
      /jpeg|jpg|png|pdf|webp|octet-stream/i.test(file.mimetype) ||
      /\.(jpe?g|png|pdf|webp)$/i.test(file.originalname);
    cb(null, ok);
  },
});

const router = express.Router();

router.get('/modules', authMiddleware, requireStudent, paymentController.listModules);
router.post('/validate-promo', authMiddleware, requireStudent, paymentController.validatePromo);
router.post(
  '/checkout',
  authMiddleware,
  requireStudent,
  (req, res, next) => {
    upload.single('slip')(req, res, err => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Upload error' });
      }
      next();
    });
  },
  paymentController.checkout
);
router.get('/history', authMiddleware, requireStudent, paymentController.history);
router.get('/invoice/:invoiceNumber/pdf', authMiddleware, requireStudent, paymentController.downloadInvoicePdf);

module.exports = router;
