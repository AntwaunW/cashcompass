const express = require('express');
const router = express.Router();

const {
  createVariableExpense,
  getVariableExpenses,
  updateVariableExpense,
  deleteVariableExpense,
} = require('../controllers/variableExpenseController');

// Import the auth middleware — every route below requires a valid JWT
const { protect } = require('../middleware/authMiddleware');
router.use(protect);

// POST /  → create a variable expense
router.post('/', createVariableExpense);

// GET /   → get all of the logged-in user's variable expenses
router.get('/', getVariableExpenses);

// PUT /:id   → update one of the logged-in user's variable expenses
router.put('/:id', updateVariableExpense);

// DELETE /:id   → delete one of the logged-in user's variable expenses
router.delete('/:id', deleteVariableExpense);

module.exports = router;
