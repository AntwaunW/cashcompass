const express = require('express');
const router = express.Router();

// Import the controller functions
const { createGoal, getGoals, updateGoal, deleteGoal } = require('../controllers/goalController');

// Import the auth middleware — every route below requires a valid JWT
const { protect } = require('../middleware/authMiddleware');
router.use(protect);

// POST /  → create a goal
router.post('/', createGoal);

// GET /   → get all of the logged-in user's goals
router.get('/', getGoals);

// PUT /:id   → update one of the logged-in user's goals
router.put('/:id', updateGoal);

// DELETE /:id   → delete one of the logged-in user's goals
router.delete('/:id', deleteGoal);

module.exports = router;
