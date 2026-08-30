// Import Express and create a router
const express = require('express');
const router = express.Router();

// Import the controller functions
const { registerUser, loginUser, getUsers } = require('../controllers/userController');

// Import the auth middleware — only the dev-helper GET below needs it,
// since register/login have to stay reachable by logged-out users.
const { protect } = require('../middleware/authMiddleware');

// POST /  → register a new user
router.post('/', registerUser);

// POST /api/users/login   → login  (NEW)
router.post('/login', loginUser);

// GET /   → get all users (dev helper — now requires a valid login,
// though it still returns every user's data, not just the caller's own)
router.get('/', protect, getUsers);

// Export the router
module.exports = router;