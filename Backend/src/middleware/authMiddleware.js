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
    const user = await Admin.findById(decoded.id)
      .select('-password')
      .populate('assignedDoctor');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid. Account not found.',
      });
    }

    if (user.role === 'assistant' && user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: user.status === 'pending'
          ? 'Signup request pending. Please wait for admin approval.'
          : 'Your assistant account has been rejected.',
      });
    }

    req.user = user;
    req.admin = user; // backwards compatibility
    next();
  } catch (error) {
    let message = 'Token is invalid.';
    if (error.name === 'TokenExpiredError') {
      message = 'Token has expired. Please log in again.';
    }
    return res.status(401).json({ success: false, message });
  }
};

/**
 * Restrict route to admin role only
 */
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: Administrator privileges required.',
  });
};

module.exports = { protect, requireAdmin };
