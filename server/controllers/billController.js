// Import the Bill model so we can create/read bills in the database
const Bill = require('../models/Bill');

// @desc    Create a new bill
// @route   POST /api/bills
// This function runs when someone sends a POST request to /api/bills
const createBill = async (req, res) => {
  try {
    // Pull the bill details out of the request body (sent by the client as JSON)
    const { user, name, amount, dueDay, frequency, category } = req.body;

    // Basic validation: user, name, and amount are the essentials — reject if missing
    if (!user || !name || amount === undefined) {
      // 400 = "Bad Request" (the client sent incomplete data)
      return res.status(400).json({ message: 'User, name, and amount are required' });
    }

    // Create the bill document in the database.
    // (user comes from the request body for now — will come from an auth token once auth exists)
    const bill = await Bill.create({
      user,
      name,
      amount,
      dueDay,
      frequency,
      category,
    });

    // 201 = "Created" — send back the newly created bill as JSON
    res.status(201).json(bill);
  } catch (error) {
    // Something went wrong on the server side — log it and send a 500 error
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all bills
// @route   GET /api/bills
// This function runs when someone sends a GET request to /api/bills
const getBills = async (req, res) => {
  try {
    // Find all bills in the database ({} means "no filter — return everything")
    const bills = await Bill.find({});

    // 200 = "OK" — send the array of bills back as JSON
    res.status(200).json(bills);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export both functions so the routes file can use them
module.exports = { createBill, getBills };