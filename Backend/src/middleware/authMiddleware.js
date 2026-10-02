const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Protect routes - verifies JWT token from Authorization header
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid. Admin not found.',
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    let message = 'Token is invalid.';
    if (error.name === 'TokenExpiredError') {
      message = 'Token has expired. Please log in again.';
    }
    return res.status(401).json({ success: false, message });
  }
};

module.exports = { protect };
