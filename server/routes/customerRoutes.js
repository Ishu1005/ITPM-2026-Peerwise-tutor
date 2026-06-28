const express = require('express');
const router = express.Router();
const { createCustomer, getAllCustomers, updateCustomer, deleteCustomer } = require('../controllers/customerController');

router.post('/', createCustomer);
router.get('/', getAllCustomers);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
