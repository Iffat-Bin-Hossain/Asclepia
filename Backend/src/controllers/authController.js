const Admin = require('../models/Admin');
const { generateToken } = require('../utils/helpers');
const { sendWelcomeEmail } = require('../utils/emailService');
const { validationResult } = require('express-validator');

/**
 * @desc  Login admin
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const token = generateToken(admin._id);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      admin: admin.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Get current admin profile
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      admin: req.admin,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Register a new admin
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password, name } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const admin = await Admin.create({ email, password, name: name || 'Admin' });
    const token = generateToken(admin._id);

    // Dispatch real email notification asynchronously
    sendWelcomeEmail(email, admin.name).catch((err) => {
      console.error('[Email Dispatch Warning]', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      admin: admin.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe, register };
