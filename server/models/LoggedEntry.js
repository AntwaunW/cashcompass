const mongoose = require('mongoose');

const loggedEntrySchema = new mongoose.Schema(
  {
    // Links this entry to its owner
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Links this entry to the specific variable expense category it belongs to.
    // This is what lets the AI group entries by category to learn each one's average.
    variableExpense: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VariableExpense',
      required: true,
    },

    // The actual amount spent in this single entry, e.g. 62
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // When the spending happened. Defaults to right now if not provided.
    date: {
      type: Date,
      default: Date.now,
    },

    // Optional free-text note, e.g. "weekly grocery run"
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LoggedEntry', loggedEntrySchema);