// Import Express and create a router (a mini, modular set of routes)
const express = require('express');
const router = express.Router();

// Import the controller functions that will run for each route
const { createBill, getBills } = require('../controllers/billController');

// When a POST request hits this router's "/", run createBill
router.post('/', createBill);

// When a GET request hits this router's "/", run getBills
router.get('/', getBills);

// Export the router so index.js can plug it in
module.exports = router;