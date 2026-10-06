const Admin = require('../models/Admin');
const Doctor = require('../models/Doctor');
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

    const user = await Admin.findOne({ email }).populate('assignedDoctor');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Role check: If assistant is not approved, prevent login
    if (user.role === 'assistant') {
      if (user.status === 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Signup request pending. Please wait for admin approval.',
        });
      }
      if (user.status === 'rejected') {
        return res.status(403).json({
          success: false,
          message: 'Your assistant signup request has been rejected.',
        });
      }
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      admin: user.toJSON(),
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      admin: req.admin,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Register a new assistant (pending admin approval)
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const {
      email,
      password,
      name,
      age,
      gender,
      phone,
      requestedDoctor,
      requestedDoctorName,
      reason,
    } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Signup role is strictly for assistant, with status pending approval
    const assistant = await Admin.create({
      email,
      password,
      name: name || 'Assistant',
      age: age ? Number(age) : null,
      gender: gender || null,
      phone: phone || null,
      role: 'assistant',
      status: 'pending',
      requestedDoctor: requestedDoctor || null,
      requestedDoctorName: requestedDoctorName || null,
      reason: reason || null,
      assignedDoctor: null,
    });

    // Asynchronously dispatch notification if configured
    sendWelcomeEmail(email, assistant.name).catch((err) => {
      console.error('[Email Dispatch Warning]', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Signup request submitted successfully. Pending admin approval.',
      pendingApproval: true,
      assistant: {
        _id: assistant._id,
        email: assistant.email,
        name: assistant.name,
        role: assistant.role,
        status: assistant.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Minimal public doctor list for the assistant signup form
 * @route GET /api/auth/doctors
 * @access Public
 */
const getSignupDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({ isActive: { $ne: false } })
      .select('name specialization hospital')
      .sort({ name: 1 })
      .lean();
    res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe, register, getSignupDoctors };
