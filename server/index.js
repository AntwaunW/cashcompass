// Load environment variables from the .env file (must run first, before anything uses a secret)
require('dotenv').config();

// Import the Express library we installed
const express = require('express');

// Lets the React frontend (running on a different origin during development)
// make requests to this API — without it the browser blocks the requests.
const cors = require('cors');

// Import our database connection function from config/db.js
const connectDB = require('./config/db');

// Import the bill routes
const billRoutes = require('./routes/billRoutes');

// Import the user routes
const userRoutes = require('./routes/userRoutes');

const debtRoutes = require('./routes/debtRoutes');

// Import the goal routes
const goalRoutes = require('./routes/goalRoutes');

// Import the income routes
const incomeRoutes = require('./routes/incomeRoutes');

// Import the variable expense routes
const variableExpenseRoutes = require('./routes/variableExpenseRoutes');

// Import the logged entry routes
const loggedEntryRoutes = require('./routes/loggedEntryRoutes');

// Import the projection routes (the cash-flow forecast / debt payoff /
// goal pacing / investable surplus endpoints)
const projectionRoutes = require('./routes/projectionRoutes');

// Import the 404 + generic error handlers (registered at the very end, below)
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Actually connect to MongoDB (runs the function we just imported)
connectDB();

// Create the Express app — this "app" object IS our server
const app = express();

// Middleware: only allow requests from the configured frontend origin
// (falls back to the typical local Vite dev server port if unset)
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));

// Middleware: lets the server understand JSON sent in request bodies (e.g. from React later)
app.use(express.json());

// A test route: when someone visits "/" (home), send back a confirmation message
app.get('/', (req, res) => {
  res.send('CashCompass server is running!');
});

// Mount the logged entry routes at "/api/logged-entries"
app.use('/api/logged-entries', loggedEntryRoutes);

// Mount the variable expense routes at "/api/variable-expenses"
app.use('/api/variable-expenses', variableExpenseRoutes);

// Mount the income routes at "/api/income"
app.use('/api/income', incomeRoutes);

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

// Mount the projection routes at "/api/projection"
app.use('/api/projection', projectionRoutes);

// These must be registered LAST, after every route above — Express checks
// middleware in order, so anything that doesn't match a route above falls
// through to notFound, and any error thrown/passed to next() anywhere above
// falls through to errorHandler.
app.use(notFound);
app.use(errorHandler);

// Read the port from .env, or fall back to 5000 if it's missing
const PORT = process.env.PORT || 5000;

// Start the server and listen for requests; the message prints once it boots successfully
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});