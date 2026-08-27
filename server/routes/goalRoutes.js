const express = require('express');
const router = express.Router();

// Import the controller functions
const { createGoal, getGoals } = require('../controllers/goalController');

// POST /  → create a goal
router.post('/', createGoal);

// GET /   → get all goals
router.get('/', getGoals);

module.exports = router;