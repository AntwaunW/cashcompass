const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema(
  {
    // Links this debt to its owner (same relationship pattern as Bill)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Name of the debt, e.g. "Car Loan" or "Visa"
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Current outstanding balance — this is the number that ticks DOWN as it's paid
    balance: {
      type: Number,
      required: true,
      min: 0,
    },

    // Annual interest rate as a percentage, e.g. 19.99 for 19.99% APR
    interestRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    // The minimum required monthly payment
    minimumPayment: {
      type: Number,
      required: true,
      min: 0,
    },

    // Any EXTRA amount the user chooses to pay on top of the minimum (defaults to 0)
    extraPayment: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Debt', debtSchema);