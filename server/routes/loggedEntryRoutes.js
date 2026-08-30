const express = require('express');
const router = express.Router();

const {
  createLoggedEntry,
  getLoggedEntries,
  updateLoggedEntry,
  deleteLoggedEntry,
} = require('../controllers/loggedEntryController');

// Import the auth middleware — every route below requires a valid JWT
const { protect } = require('../middleware/authMiddleware');
router.use(protect);

// POST /  → create a logged entry
router.post('/', createLoggedEntry);

// GET /   → get all of the logged-in user's logged entries
router.get('/', getLoggedEntries);

// PUT /:id   → update one of the logged-in user's logged entries
router.put('/:id', updateLoggedEntry);

// DELETE /:id   → delete one of the logged-in user's logged entries
router.delete('/:id', deleteLoggedEntry);

module.exports = router;
