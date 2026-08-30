// This middleware protects routes by requiring a valid JWT.
// Any route that uses `protect` will only run its controller if the request
// includes a valid "Authorization: Bearer <token>" header — otherwise it
// short-circuits with a 401 before the controller ever runs.
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Tokens are sent as "Authorization: Bearer <token>" — pull the header apart
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // No header at all, or it wasn't in the "Bearer <token>" shape
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify the token's signature/expiry using the same secret it was signed with.
    // Throws if the token is malformed, expired, or signed with a different secret.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // The token only carries the user's id (see generateToken in userController.js) —
    // look up the actual user so downstream controllers have real data to work with.
    // .select('-password') keeps the hash out of req.user.
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      // Token is valid, but the account it points to no longer exists
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // Attach the authenticated user to the request so every controller downstream
    // can trust req.user._id instead of anything the client claims in the body.
    req.user = user;
    next();
  } catch (error) {
    console.error(error.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
