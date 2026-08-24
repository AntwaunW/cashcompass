const express = require('express');
const router = express.Router();

// Import the controller functions
const { createDebt, getDebts } = require('../controllers/debtController');

// POST /  → create a debt
router.post('/', createDebt);

// GET /   → get all debts
router.get('/', getDebts);

module.exports = router;