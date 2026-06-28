const express = require('express');
const router = express.Router();
const { register, login, logout, getSession } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/session', getSession); // check current session

module.exports = router;
