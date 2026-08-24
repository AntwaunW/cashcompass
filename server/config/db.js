// Import Mongoose — the library that lets our Node code talk to MongoDB
const mongoose = require('mongoose');

// Define an async function that connects to the database
// (async because connecting takes time — we have to "wait" for it)
const connectDB = async () => {
  try {
    // Attempt to connect using the connection string stored in .env
    // "await" pauses here until the connection succeeds or fails
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // If we get here, it worked — log which host we connected to
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If the connection failed, log the error message...
    console.error(`Error: ${error.message}`);

    // ...and shut the app down, since there's no point running without a database
    process.exit(1);
  }
};

// Export the function so index.js can import and call it
module.exports = connectDB;