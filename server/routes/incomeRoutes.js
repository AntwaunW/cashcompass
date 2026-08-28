const express = require('express');
const router = express.Router();

const { createIncomeSource, getIncomeSources } = require('../controllers/incomeSourceController');

// POST /  → create an income source
router.post('/', createIncomeSource);

// GET /   → get all income sources
router.get('/', getIncomeSources);

module.exports = router;