const express = require('express');
const router = express.Router();

// Import the controller functions
const { createDebt, getDebts, updateDebt, deleteDebt } = require('../controllers/debtController');

// Import the auth middleware — every route below requires a valid JWT
const { protect } = require('../middleware/authMiddleware');
router.use(protect);

// POST /  → create a debt
router.post('/', createDebt);

// GET /   → get all of the logged-in user's debts
router.get('/', getDebts);

// PUT /:id   → update one of the logged-in user's debts (e.g. balance paid down)
router.put('/:id', updateDebt);

// DELETE /:id   → delete one of the logged-in user's debts
router.delete('/:id', deleteDebt);

module.exports = router;
