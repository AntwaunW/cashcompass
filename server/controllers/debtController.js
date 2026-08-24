// Import the Debt model so we can create/read debts
const Debt = require('../models/Debt');

// @desc    Create a new debt
// @route   POST /api/debts
const createDebt = async (req, res) => {
  try {
    // Pull debt details from the request body
    const { user, name, balance, interestRate, minimumPayment, extraPayment } = req.body;

    // Validate the essentials (user, name, balance, minimumPayment are required)
    if (!user || !name || balance === undefined || minimumPayment === undefined) {
      return res.status(400).json({
        message: 'user, name, balance, and minimumPayment are required',
      });
    }

    // Create the debt document in the database
    const debt = await Debt.create({
      user,
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

// @desc    Get all debts
// @route   GET /api/debts
const getDebts = async (req, res) => {
  try {
    // Find all debts ({} = no filter). Later we'll filter by logged-in user.
    const debts = await Debt.find({});
    res.status(200).json(debts);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export both functions
module.exports = { createDebt, getDebts };