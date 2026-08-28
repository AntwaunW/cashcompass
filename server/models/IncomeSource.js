const mongoose = require('mongoose');

const incomeSourceSchema = new mongoose.Schema(
  {
    // Links this income source to its owner
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Name of the income source, e.g. "Day Job", "Real Estate", "Lawn Care"
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Whether this income is predictable ('regular') or lumpy/unpredictable ('irregular')
    type: {
      type: String,
      enum: ['regular', 'irregular'],
      default: 'regular',
    },

    // For REGULAR income: how much arrives each pay period
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // For REGULAR income: how often it arrives
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'semimonthly', 'monthly', 'yearly'],
      default: 'monthly',
    },

    // For IRREGULAR income: an estimated monthly average.
    // Starts as a user estimate; later the AI can suggest a learned average here.
    estimatedMonthlyAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IncomeSource', incomeSourceSchema);