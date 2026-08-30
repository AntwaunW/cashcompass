const express = require('express');
const router = express.Router();

const {
  createIncomeSource,
  getIncomeSources,
  updateIncomeSource,
  deleteIncomeSource,
} = require('../controllers/incomeSourceController');

// Import the auth middleware — every route below requires a valid JWT
const { protect } = require('../middleware/authMiddleware');
router.use(protect);

// POST /  → create an income source
router.post('/', createIncomeSource);

// GET /   → get all of the logged-in user's income sources
router.get('/', getIncomeSources);

// PUT /:id   → update one of the logged-in user's income sources
router.put('/:id', updateIncomeSource);

// DELETE /:id   → delete one of the logged-in user's income sources
router.delete('/:id', deleteIncomeSource);

module.exports = router;
