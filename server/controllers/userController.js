// Import the User model so we can create/read users in the database
const User = require('../models/User');

// Import bcryptjs to hash passwords before saving them
const bcrypt = require('bcryptjs');

// @desc    Register a new user
// @route   POST /api/users
const registerUser = async (req, res) => {
  try {
    // Pull the signup details out of the request body
    const { name, email, password } = req.body;

    // Validation: all three are required to make an account
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    // Check if a user with this email already exists (emails must be unique)
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate a "salt" — random data mixed in so identical passwords hash differently
    const salt = await bcrypt.genSalt(10);

    // Hash the plain password together with the salt — this is what we actually store
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user in the database with the HASHED password (never the plain one)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Success — send back the new user's basic info.
    // NOTE: we deliberately do NOT send the password back, even hashed.
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users (temporary — handy for grabbing IDs during development)
// @route   GET /api/users
const getUsers = async (req, res) => {
  try {
    // Find all users, but exclude the password field from the results
    // The "-password" tells Mongoose: return everything EXCEPT password
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export both functions
module.exports = { registerUser, getUsers };