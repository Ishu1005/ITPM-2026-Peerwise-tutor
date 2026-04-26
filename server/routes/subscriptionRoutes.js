const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requireStudent = require('../middleware/requireStudent');
const subscriptionController = require('../controllers/subscriptionController');

const router = express.Router();

router.get('/plans', authMiddleware, requireStudent, subscriptionController.listPlans);
router.post('/subscribe', authMiddleware, requireStudent, subscriptionController.subscribe);
router.get('/me', authMiddleware, requireStudent, subscriptionController.mySubscriptions);
router.post('/:id/cancel', authMiddleware, requireStudent, subscriptionController.cancelSubscription);

module.exports = router;
