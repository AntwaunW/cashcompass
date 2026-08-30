// Import the IncomeSource model so we can create/read/update/delete income sources
const IncomeSource = require('../models/IncomeSource');

// @desc    Create a new income source
// @route   POST /api/income
const createIncomeSource = async (req, res) => {
  try {
    // "user" comes from req.user (set by the protect middleware), not the body
    const { name, type, amount, frequency, estimatedMonthlyAmount } = req.body;

    // Every income source needs a name
    if (!name) {
      return res.status(400).json({ message: 'name is required' });
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

    // Create the income source, owned by whoever is logged in
    const incomeSource = await IncomeSource.create({
      user: req.user._id,
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

// @desc    Get all income sources belonging to the logged-in user
// @route   GET /api/income
const getIncomeSources = async (req, res) => {
  try {
    const incomeSources = await IncomeSource.find({ user: req.user._id });
    res.status(200).json(incomeSources);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update an income source (only if it belongs to the logged-in user)
// @route   PUT /api/income/:id
// Note: unlike createIncomeSource, this does NOT re-run the
// regular-vs-irregular conditional validation — it simply applies whatever
// fields the caller sends. A partial update that leaves a record in a
// slightly inconsistent state (e.g. switching type without also sending the
// now-relevant amount field) is an accepted edge case for this version.
const updateIncomeSource = async (req, res) => {
  try {
    const incomeSource = await IncomeSource.findOne({ _id: req.params.id, user: req.user._id });
    if (!incomeSource) {
      return res.status(404).json({ message: 'Income source not found' });
    }

    const { name, type, amount, frequency, estimatedMonthlyAmount } = req.body;

    // `!== undefined` (not a falsy check) since 0 is a valid amount
    if (name !== undefined) incomeSource.name = name;
    if (type !== undefined) incomeSource.type = type;
    if (amount !== undefined) incomeSource.amount = amount;
    if (frequency !== undefined) incomeSource.frequency = frequency;
    if (estimatedMonthlyAmount !== undefined) incomeSource.estimatedMonthlyAmount = estimatedMonthlyAmount;

    const updatedIncomeSource = await incomeSource.save();
    res.status(200).json(updatedIncomeSource);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Income source not found' });
    }
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete an income source (only if it belongs to the logged-in user)
// @route   DELETE /api/income/:id
const deleteIncomeSource = async (req, res) => {
  try {
    const incomeSource = await IncomeSource.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!incomeSource) {
      return res.status(404).json({ message: 'Income source not found' });
    }
    res.status(200).json({ message: 'Income source deleted', _id: req.params.id });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Income source not found' });
    }
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createIncomeSource, getIncomeSources, updateIncomeSource, deleteIncomeSource };
