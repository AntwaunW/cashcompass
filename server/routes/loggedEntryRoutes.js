const express = require('express');
const router = express.Router();

const { createLoggedEntry, getLoggedEntries } = require('../controllers/loggedEntryController');

// POST /  → create a logged entry
router.post('/', createLoggedEntry);

// GET /   → get all logged entries
router.get('/', getLoggedEntries);

module.exports = router;