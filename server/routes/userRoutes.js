// Import Express and create a router
const express = require('express');
const router = express.Router();

// Import the controller functions
const { registerUser, loginUser, getUsers } = require('../controllers/userController');

// POST /  → register a new user
router.post('/', registerUser);

// POST /api/users/login   → login  (NEW)
router.post('/login', loginUser);

// GET /   → get all users
router.get('/', getUsers);

// Export the router
module.exports = router;