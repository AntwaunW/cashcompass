// Import Mongoose
const mongoose = require('mongoose');

// Define the blueprint (schema) for a Bill document
const billSchema = new mongoose.Schema(
  {
    // Links this bill to the user who owns it.
    // Stores that user's unique ID, and "ref: 'User'" points to the User model.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The bill's name, e.g. "Rent" or "Netflix"
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // How much the bill is — a number, required, can't be negative
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Which day of the month it's due (1–31)
    dueDay: {
      type: Number,
      min: 1,
      max: 31,
    },

    // How often the bill recurs — restricted to these options, defaults to monthly
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', 'yearly'],
      default: 'monthly',
    },

    // Optional grouping label, e.g. "Housing" or "Utilities"
    category: {
      type: String,
      trim: true,
      default: 'Uncategorized',
    },
  },
  // Auto-add createdAt / updatedAt timestamps
  { timestamps: true }
);

// Turn the schema into a model named "Bill" and export it
module.exports = mongoose.model('Bill', billSchema);