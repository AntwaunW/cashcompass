// Import the Goal model so we can create/read goals
const Goal = require('../models/Goal');

// @desc    Create a new goal
// @route   POST /api/goals
const createGoal = async (req, res) => {
  try {
    // Pull goal details from the request body
    const { user, name, targetAmount, currentAmount, targetDate, type } = req.body;

    // Validate the essentials (user, name, targetAmount are required)
    if (!user || !name || targetAmount === undefined) {
      return res.status(400).json({
        message: 'user, name, and targetAmount are required',
      });
    }

    // Create the goal document in the database
    const goal = await Goal.create({
      user,
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

// @desc    Get all goals
// @route   GET /api/goals
const getGoals = async (req, res) => {
  try {
    // Find all goals ({} = no filter). Later we'll filter by logged-in user.
    const goals = await Goal.find({});
    res.status(200).json(goals);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createGoal, getGoals };