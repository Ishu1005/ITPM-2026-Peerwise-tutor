const express = require('express');
const router = express.Router();
const { getModules } = require('../controllers/moduleController');

router.get('/', getModules);

module.exports = router;
