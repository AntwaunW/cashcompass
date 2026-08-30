// Import the VariableExpense model
const VariableExpense = require('../models/VariableExpense');

// @desc    Create a new variable expense
// @route   POST /api/variable-expenses
const createVariableExpense = async (req, res) => {
  try {
    // "user" comes from req.user (set by the protect middleware), not the body
    const { name, estimatedMonthlyAmount } = req.body;

    // Validate the essentials
    if (!name || estimatedMonthlyAmount === undefined) {
      return res.status(400).json({
        message: 'name and estimatedMonthlyAmount are required',
      });
    }

    // Create the variable expense, owned by whoever is logged in
    const variableExpense = await VariableExpense.create({
      user: req.user._id,
      name,
      estimatedMonthlyAmount,
    });

    res.status(201).json(variableExpense);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all variable expenses belonging to the logged-in user
// @route   GET /api/variable-expenses
const getVariableExpenses = async (req, res) => {
  try {
    const variableExpenses = await VariableExpense.find({ user: req.user._id });
    res.status(200).json(variableExpenses);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a variable expense (only if it belongs to the logged-in user)
// @route   PUT /api/variable-expenses/:id
const updateVariableExpense = async (req, res) => {
  try {
    const variableExpense = await VariableExpense.findOne({ _id: req.params.id, user: req.user._id });
    if (!variableExpense) {
      return res.status(404).json({ message: 'Variable expense not found' });
    }

    const { name, estimatedMonthlyAmount } = req.body;

    // `!== undefined` (not a falsy check) since 0 is a valid amount
    if (name !== undefined) variableExpense.name = name;
    if (estimatedMonthlyAmount !== undefined) variableExpense.estimatedMonthlyAmount = estimatedMonthlyAmount;

    const updatedVariableExpense = await variableExpense.save();
    res.status(200).json(updatedVariableExpense);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Variable expense not found' });
    }
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a variable expense (only if it belongs to the logged-in user)
// @route   DELETE /api/variable-expenses/:id
const deleteVariableExpense = async (req, res) => {
  try {
    const variableExpense = await VariableExpense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!variableExpense) {
      return res.status(404).json({ message: 'Variable expense not found' });
    }
    res.status(200).json({ message: 'Variable expense deleted', _id: req.params.id });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Variable expense not found' });
    }
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createVariableExpense,
  getVariableExpenses,
  updateVariableExpense,
  deleteVariableExpense,
};
