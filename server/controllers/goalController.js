// Import the Goal model so we can create/read/update/delete goals
const Goal = require('../models/Goal');

// @desc    Create a new goal
// @route   POST /api/goals
const createGoal = async (req, res) => {
  try {
    // "user" comes from req.user (set by the protect middleware after
    // verifying the JWT), not from the request body.
    const { name, targetAmount, currentAmount, targetDate, type } = req.body;

    // Validate the essentials (name, targetAmount are required)
    if (!name || targetAmount === undefined) {
      return res.status(400).json({
        message: 'name and targetAmount are required',
      });
    }

    // Create the goal document, owned by whoever is logged in
    const goal = await Goal.create({
      user: req.user._id,
      name,
      targetAmount,
      currentAmount,
      targetDate,
      type,
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all goals belonging to the logged-in user
// @route   GET /api/goals
const getGoals = async (req, res) => {
  try {
    // Only this user's goals — never the whole collection
    const goals = await Goal.find({ user: req.user._id });
    res.status(200).json(goals);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a goal (only if it belongs to the logged-in user)
// @route   PUT /api/goals/:id
const updateGoal = async (req, res) => {
  try {
    // Scoping by both _id and user collapses "doesn't exist" and "exists
    // but isn't yours" into the same null/404 outcome — no ownership leak.
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const { name, targetAmount, currentAmount, targetDate, type } = req.body;

    // `!== undefined` (not a falsy check) since 0 is a valid currentAmount
    if (name !== undefined) goal.name = name;
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (currentAmount !== undefined) goal.currentAmount = currentAmount;
    if (targetDate !== undefined) goal.targetDate = targetDate;
    if (type !== undefined) goal.type = type;

    // .save() re-runs schema validation (min:0, enum, etc.), same as .create()
    const updatedGoal = await goal.save();
    res.status(200).json(updatedGoal);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a goal (only if it belongs to the logged-in user)
// @route   DELETE /api/goals/:id
const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.status(200).json({ message: 'Goal deleted', _id: req.params.id });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createGoal, getGoals, updateGoal, deleteGoal };
