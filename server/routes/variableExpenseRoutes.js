const express = require('express');
const router = express.Router();

const { createVariableExpense, getVariableExpenses } = require('../controllers/variableExpenseController');

// POST /  → create a variable expense
router.post('/', createVariableExpense);

// GET /   → get all variable expenses
router.get('/', getVariableExpenses);

module.exports = router;