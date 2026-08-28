// Import the LoggedEntry model
const LoggedEntry = require('../models/LoggedEntry');

// @desc    Create a new logged entry
// @route   POST /api/logged-entries
const createLoggedEntry = async (req, res) => {
  try {
    // Pull details from the request body
    const { user, variableExpense, amount, date, note } = req.body;

    // Validate the essentials: needs an owner, a category to attach to, and an amount
    if (!user || !variableExpense || amount === undefined) {
      return res.status(400).json({
        message: 'user, variableExpense, and amount are required',
      });
    }

    // Create the logged entry in the database
    const loggedEntry = await LoggedEntry.create({
      user,
      variableExpense,
      amount,
      date,
      note,
    });

    res.status(201).json(loggedEntry);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all logged entries
// @route   GET /api/logged-entries
const getLoggedEntries = async (req, res) => {
  try {
    const loggedEntries = await LoggedEntry.find({});
    res.status(200).json(loggedEntries);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createLoggedEntry, getLoggedEntries };