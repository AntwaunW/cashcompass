const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    // Links this goal to its owner (same relationship pattern as your other models)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Name of the goal, e.g. "Emergency Fund" or "New Truck"
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // How much money the goal needs in total, e.g. 5000
    targetAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // How much has been saved toward it so far — ticks UP as the user contributes
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Optional deadline — the date they want to hit the target by
    targetDate: {
      type: Date,
    },

    // What kind of goal this is — lets the app treat savings vs. purchases differently
    type: {
      type: String,
      enum: ['savings', 'purchase'],
      default: 'savings',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Goal', goalSchema);