// Load environment variables from the .env file (must run first, before anything uses a secret)
require('dotenv').config();

// Import the Express library we installed
const express = require('express');

// Import our database connection function from config/db.js
const connectDB = require('./config/db');

// Import the bill routes
const billRoutes = require('./routes/billRoutes');

// Import the user routes
const userRoutes = require('./routes/userRoutes');

const debtRoutes = require('./routes/debtRoutes');

// Import the goal routes
const goalRoutes = require('./routes/goalRoutes');

// Actually connect to MongoDB (runs the function we just imported)
connectDB();

// Create the Express app — this "app" object IS our server
const app = express();

// Middleware: lets the server understand JSON sent in request bodies (e.g. from React later)
app.use(express.json());

// A test route: when someone visits "/" (home), send back a confirmation message
app.get('/', (req, res) => {
  res.send('CashCompass server is running!');
});

// Mount the goal routes at "/api/goals"
app.use('/api/goals', goalRoutes);

// Mount the bill routes at "/api/bills"
// Every route inside billRoutes is now prefixed with /api/bills
app.use('/api/bills', billRoutes);

// Mount the debt routes at "/api/debt"
// Every route inside debtRoutes is now prefixed with /api/debt
app.use('/api/debts', debtRoutes);

// Mount the user routes at "/api/users"
app.use('/api/users', userRoutes);

// Read the port from .env, or fall back to 5000 if it's missing
const PORT = process.env.PORT || 5000;

// Start the server and listen for requests; the message prints once it boots successfully
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});