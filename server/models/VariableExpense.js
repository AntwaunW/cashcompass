const mongoose = require('mongoose');

const variableExpenseSchema = new mongoose.Schema(
  {
    // Links this variable expense to its owner
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The category name — user-defined, ANY variable cost
    // (e.g. "Groceries", "Gas", "Dining Out", "Entertainment", "Pet Care")
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // The current monthly estimate the projection engine uses for this category.
    // Starts as a user estimate; later the AI can suggest a learned average here.
    estimatedMonthlyAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VariableExpense', variableExpenseSchema);