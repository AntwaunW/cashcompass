// Import the IncomeSource model so we can create/read income sources
const IncomeSource = require('../models/IncomeSource');

// @desc    Create a new income source
// @route   POST /api/income
const createIncomeSource = async (req, res) => {
  try {
    // Pull income details from the request body
    const { user, name, type, amount, frequency, estimatedMonthlyAmount } = req.body;

    // Every income source needs an owner and a name
    if (!user || !name) {
      return res.status(400).json({ message: 'user and name are required' });
    }

    // Conditional validation: what's required depends on the TYPE of income
    if (type === 'irregular') {
      // Irregular income must have an estimated monthly amount to forecast with
      if (estimatedMonthlyAmount === undefined) {
        return res.status(400).json({
          message: 'Irregular income requires an estimatedMonthlyAmount',
        });
      }
    } else {
      // Regular income (the default) must have an amount to forecast with
      if (amount === undefined) {
        return res.status(400).json({
          message: 'Regular income requires an amount',
        });
      }
    }

    // Create the income source in the database
    const incomeSource = await IncomeSource.create({
      user,
      name,
      type,
      amount,
      frequency,
      estimatedMonthlyAmount,
    });

    res.status(201).json(incomeSource);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all income sources
// @route   GET /api/income
const getIncomeSources = async (req, res) => {
  try {
    const incomeSources = await IncomeSource.find({});
    res.status(200).json(incomeSources);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createIncomeSource, getIncomeSources };