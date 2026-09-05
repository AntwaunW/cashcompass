// Import the Bill model so we can create/read/update/delete bills in the database
const Bill = require('../models/Bill');

// @desc    Create a new bill
// @route   POST /api/bills
// This function runs when someone sends a POST request to /api/bills
const createBill = async (req, res) => {
  try {
    // Pull the bill details out of the request body (sent by the client as JSON).
    // Note: "user" is NOT read from the body anymore — trusting a client-supplied
    // owner id would let anyone create data under someone else's account. The
    // owner now always comes from req.user, which the `protect` middleware
    const { name, amount, dueDay, frequency, category } = req.body;

    // Basic validation: name and amount are the essentials — reject if missing
    if (!name || amount === undefined) {
      // 400 = "Bad Request" (the client sent incomplete data)
      return res.status(400).json({ message: 'Name and amount are required' });
    }

    // Create the bill document, owned by whoever is logged in
    const bill = await Bill.create({
      user: req.user._id,
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

// @desc    Get all bills belonging to the logged-in user
// @route   GET /api/bills
// This function runs when someone sends a GET request to /api/bills
const getBills = async (req, res) => {
  try {
    // Only return bills owned by the requester — never the whole collection
    const bills = await Bill.find({ user: req.user._id });

    // 200 = "OK" — send the array of bills back as JSON
    res.status(200).json(bills);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a bill (only if it belongs to the logged-in user)
// @route   PUT /api/bills/:id
const updateBill = async (req, res) => {
  try {
    // Scope the lookup by BOTH the document id and the owner. If the bill
    // doesn't exist, or exists but belongs to someone else, this comes back
    // null either way — and we return the same 404 for both cases so a
    // caller can't use this endpoint to probe which ids belong to other users.
    const bill = await Bill.findOne({ _id: req.params.id, user: req.user._id });
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    const { name, amount, dueDay, frequency, category } = req.body;

    // Only touch fields that were actually sent. Using `!== undefined` (not a
    // falsy check) matters here because 0 is a valid amount/dueDay.
    if (name !== undefined) bill.name = name;
    if (amount !== undefined) bill.amount = amount;
    if (dueDay !== undefined) bill.dueDay = dueDay;
    if (frequency !== undefined) bill.frequency = frequency;
    if (category !== undefined) bill.category = category;

    // .save() (rather than findOneAndUpdate) re-runs the schema's validators
    // (min:0, enum checks, etc.) the same way .create() does.
    const updatedBill = await bill.save();
    res.status(200).json(updatedBill);
  } catch (error) {
    // A malformed :id (not a valid ObjectId) throws a CastError — treat that
    // as "not found" too, same as any other lookup miss.
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Bill not found' });
    }
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a bill (only if it belongs to the logged-in user)
// @route   DELETE /api/bills/:id
const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.status(200).json({ message: 'Bill deleted', _id: req.params.id });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Bill not found' });
    }
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export all four functions so the routes file can use them
module.exports = { createBill, getBills, updateBill, deleteBill };
