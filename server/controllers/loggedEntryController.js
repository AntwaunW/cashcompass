// Import the LoggedEntry model, plus VariableExpense so we can verify a
// logged entry is being attached to a category the requester actually owns.
const LoggedEntry = require('../models/LoggedEntry');
const VariableExpense = require('../models/VariableExpense');

// @desc    Create a new logged entry
// @route   POST /api/logged-entries
const createLoggedEntry = async (req, res) => {
  try {
    // "user" comes from req.user (set by the protect middleware), not the body
    const { variableExpense, amount, date, note } = req.body;

    // Validate the essentials: needs a category to attach to, and an amount
    if (!variableExpense || amount === undefined) {
      return res.status(400).json({
        message: 'variableExpense and amount are required',
      });
    }

    // Make sure the variableExpense id being referenced actually belongs to
    // this user — without this check, a user could log spend against
    // someone else's expense category just by guessing its id.
    const ownedExpense = await VariableExpense.findOne({ _id: variableExpense, user: req.user._id });
    if (!ownedExpense) {
      return res.status(400).json({ message: 'Invalid variableExpense' });
    }

    // Create the logged entry, owned by whoever is logged in
    const loggedEntry = await LoggedEntry.create({
      user: req.user._id,
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

// @desc    Get all logged entries belonging to the logged-in user
// @route   GET /api/logged-entries
const getLoggedEntries = async (req, res) => {
  try {
    const loggedEntries = await LoggedEntry.find({ user: req.user._id });
    res.status(200).json(loggedEntries);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a logged entry (only if it belongs to the logged-in user)
// @route   PUT /api/logged-entries/:id
const updateLoggedEntry = async (req, res) => {
  try {
    const loggedEntry = await LoggedEntry.findOne({ _id: req.params.id, user: req.user._id });
    if (!loggedEntry) {
      return res.status(404).json({ message: 'Logged entry not found' });
    }

    const { variableExpense, amount, date, note } = req.body;

    // If the caller is re-pointing this entry at a different expense
    // category, re-verify ownership of that category too.
    if (variableExpense !== undefined) {
      const ownedExpense = await VariableExpense.findOne({ _id: variableExpense, user: req.user._id });
      if (!ownedExpense) {
        return res.status(400).json({ message: 'Invalid variableExpense' });
      }
      loggedEntry.variableExpense = variableExpense;
    }

    // `!== undefined` (not a falsy check) since 0 is a valid amount
    if (amount !== undefined) loggedEntry.amount = amount;
    if (date !== undefined) loggedEntry.date = date;
    if (note !== undefined) loggedEntry.note = note;

    const updatedLoggedEntry = await loggedEntry.save();
    res.status(200).json(updatedLoggedEntry);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Logged entry not found' });
    }
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a logged entry (only if it belongs to the logged-in user)
// @route   DELETE /api/logged-entries/:id
const deleteLoggedEntry = async (req, res) => {
  try {
    const loggedEntry = await LoggedEntry.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!loggedEntry) {
      return res.status(404).json({ message: 'Logged entry not found' });
    }
    res.status(200).json({ message: 'Logged entry deleted', _id: req.params.id });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Logged entry not found' });
    }
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createLoggedEntry,
  getLoggedEntries,
  updateLoggedEntry,
  deleteLoggedEntry,
};
