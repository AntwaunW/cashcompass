// Import the Debt model so we can create/read/update/delete debts
const Debt = require('../models/Debt');

// @desc    Create a new debt
// @route   POST /api/debts
const createDebt = async (req, res) => {
  try {
    // "user" no longer comes from the body — it's derived from the verified
    // JWT (req.user, attached by the protect middleware) so no one can create
    // a debt under another account by supplying a different id.
    const { name, balance, interestRate, minimumPayment, extraPayment } = req.body;

    // Validate the essentials (name, balance, minimumPayment are required)
    if (!name || balance === undefined || minimumPayment === undefined) {
      return res.status(400).json({
        message: 'name, balance, and minimumPayment are required',
      });
    }

    // Create the debt document, owned by whoever is logged in
    const debt = await Debt.create({
      user: req.user._id,
      name,
      balance,
      interestRate,
      minimumPayment,
      extraPayment,
    });

    // 201 = Created
    res.status(201).json(debt);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all debts belonging to the logged-in user
// @route   GET /api/debts
const getDebts = async (req, res) => {
  try {
    // Only this user's debts — never the whole collection
    const debts = await Debt.find({ user: req.user._id });
    res.status(200).json(debts);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a debt (only if it belongs to the logged-in user)
// @route   PUT /api/debts/:id
// This is how a paid-down debt's balance gets updated over time.
const updateDebt = async (req, res) => {
  try {
    // Scoping by both _id and user means a mismatch (wrong owner OR
    // nonexistent id) returns the same null — and the same 404 below —
    // so this endpoint can't be used to fish for other users' debt ids.
    const debt = await Debt.findOne({ _id: req.params.id, user: req.user._id });
    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }

    const { name, balance, interestRate, minimumPayment, extraPayment } = req.body;

    // `!== undefined` (not a falsy check) because 0 is a valid balance,
    // interest rate, or payment amount.
    if (name !== undefined) debt.name = name;
    if (balance !== undefined) debt.balance = balance;
    if (interestRate !== undefined) debt.interestRate = interestRate;
    if (minimumPayment !== undefined) debt.minimumPayment = minimumPayment;
    if (extraPayment !== undefined) debt.extraPayment = extraPayment;

    // .save() re-runs schema validation (min:0 etc.), same as .create()
    const updatedDebt = await debt.save();
    res.status(200).json(updatedDebt);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Debt not found' });
    }
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a debt (only if it belongs to the logged-in user)
// @route   DELETE /api/debts/:id
const deleteDebt = async (req, res) => {
  try {
    const debt = await Debt.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }
    res.status(200).json({ message: 'Debt deleted', _id: req.params.id });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Debt not found' });
    }
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export all four functions
module.exports = { createDebt, getDebts, updateDebt, deleteDebt };
