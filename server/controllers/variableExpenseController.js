// Import the VariableExpense model
const VariableExpense = require('../models/VariableExpense');

// @desc    Create a new variable expense
// @route   POST /api/variable-expenses
const createVariableExpense = async (req, res) => {
  try {
    // Pull details from the request body
    const { user, name, estimatedMonthlyAmount } = req.body;

    // Validate the essentials
    if (!user || !name || estimatedMonthlyAmount === undefined) {
      return res.status(400).json({
        message: 'user, name, and estimatedMonthlyAmount are required',
      });
    }

    // Create the variable expense in the database
    const variableExpense = await VariableExpense.create({
      user,
      name,
      estimatedMonthlyAmount,
    });

    res.status(201).json(variableExpense);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all variable expenses
// @route   GET /api/variable-expenses
const getVariableExpenses = async (req, res) => {
  try {
    const variableExpenses = await VariableExpense.find({});
    res.status(200).json(variableExpenses);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createVariableExpense, getVariableExpenses };