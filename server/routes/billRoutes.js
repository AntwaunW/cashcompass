const express = require('express');
const router = express.Router();

// Import the controller functions
const { createBill, getBills, updateBill, deleteBill } = require('../controllers/billController');

// Import the auth middleware — every route below requires a valid JWT
const { protect } = require('../middleware/authMiddleware');

// Applying protect here (once, via router.use) means every route defined
// after this line requires a logged-in user — no need to repeat it per-route.
router.use(protect);

// POST /  → create a bill
router.post('/', createBill);

// GET /   → get all of the logged-in user's bills
router.get('/', getBills);

// PUT /:id   → update one of the logged-in user's bills
router.put('/:id', updateBill);

// DELETE /:id   → delete one of the logged-in user's bills
router.delete('/:id', deleteBill);

module.exports = router;
