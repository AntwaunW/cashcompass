// Import Mongoose so we can define a schema and create a model
const mongoose = require('mongoose');

// Define the blueprint (schema) for a User document
const userSchema = new mongoose.Schema(
  {
    // The user's display name — text, required, with surrounding spaces trimmed off
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // The user's email — required, must be unique (no duplicate accounts),
    // stored lowercase so "Bob@x.com" and "bob@x.com" aren't treated as different
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // The user's password (we'll store a hashed version later, never plain text)
    password: {
      type: String,
      required: true,
    },

    // Nested object grouping the user's pay-cycle info (powers paycheck-aware forecasting)
    payCycle: {
      // How often they get paid — restricted to these four options only
      frequency: {
        type: String,
        enum: ['weekly', 'biweekly', 'semimonthly', 'monthly'],
        default: 'monthly',
      },
      // A reference date to count pay periods from (e.g. a known payday)
      anchorDate: {
        type: Date,
      },
    },
  },
  // Options: automatically add "createdAt" and "updatedAt" timestamps to every user
  { timestamps: true }
);

// Turn the schema into a model named "User" and export it for other files to use
module.exports = mongoose.model('User', userSchema);