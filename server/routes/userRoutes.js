// Import Express and create a router
const express = require('express');
const router = express.Router();

// Import the controller functions
const { registerUser, getUsers } = require('../controllers/userController');

// POST /  → register a new user
router.post('/', registerUser);

// GET /   → get all users
router.get('/', getUsers);

// Export the router
module.exports = router;