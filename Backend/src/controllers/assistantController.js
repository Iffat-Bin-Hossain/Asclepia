const Admin = require('../models/Admin');
const Doctor = require('../models/Doctor');
const { escapeRegex } = require('../utils/helpers');

/**
 * @desc  Get all assistants (Admin only)
 * @route GET /api/assistants
 * @access Private/Admin
 */
const getAssistants = async (req, res, next) => {
  try {
    const {
      search = '',
      status = 'all',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const filter = { role: 'assistant' };

    const cleanSearch = search.trim();
    if (cleanSearch) {
      const searchRegex = new RegExp(escapeRegex(cleanSearch), 'i');
      const orConditions = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { reason: searchRegex },
        { requestedDoctorName: searchRegex },
      ];

      // Support date searches (YYYY-MM-DD or DD/MM/YYYY)
      const dateParts = cleanSearch.match(/^(\d{4})-(\d{2})-(\d{2})$/) || cleanSearch.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (dateParts) {
        let year, month, day;
        if (cleanSearch.includes('-')) {
          [, year, month, day] = dateParts;
        } else {
          [, day, month, year] = dateParts;
        }
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        if (!isNaN(startOfDay.getTime())) {
          orConditions.push({ createdAt: { $gte: startOfDay, $lte: endOfDay } });
        }
      }

      filter.$or = orConditions;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortDirection };

    const [assistants, total, pendingCount, totalAssistants] = await Promise.all([
      Admin.find(filter)
        .select('-password')
        .populate('assignedDoctor', 'name specialization hospital email phone')
        .populate('requestedDoctor', 'name specialization hospital email phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Admin.countDocuments(filter),
      Admin.countDocuments({ role: 'assistant', status: 'pending' }),
      Admin.countDocuments({ role: 'assistant' }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: assistants,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      meta: {
        total: totalAssistants,
        pendingCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Update assistant approval status (Admin only)
 * @route PUT /api/assistants/:id/status
 * @access Private/Admin
 */
const updateAssistantStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected.',
      });
    }

    // Doctor assignment is a separate, manual admin step done AFTER approval.
    // Any non-approved status removes access, so clear the assignment.
    const updateData = { status };
    if (status !== 'approved') {
      updateData.assignedDoctor = null;
    }

    const assistant = await Admin.findOneAndUpdate(
      { _id: req.params.id, role: 'assistant' },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignedDoctor', 'name specialization hospital email phone')
      .populate('requestedDoctor', 'name specialization hospital email phone');

    if (!assistant) {
      return res.status(404).json({ success: false, message: 'Assistant not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Assistant status updated to ${status}.`,
      data: assistant,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Assign or unassign doctor to assistant (Admin only)
 * @route PUT /api/assistants/:id/assign-doctor
 * @access Private/Admin
 */
const assignDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.body;

    const existing = await Admin.findOne({ _id: req.params.id, role: 'assistant' });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Assistant not found.' });
    }
    if (doctorId && existing.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Approve the assistant before assigning a doctor.',
      });
    }

    let doctor = null;
    if (doctorId) {
      doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor not found.' });
      }
    }

    const assistant = await Admin.findOneAndUpdate(
      { _id: req.params.id, role: 'assistant' },
      { assignedDoctor: doctorId || null },
      { new: true, runValidators: true }
    )
      .populate('assignedDoctor', 'name specialization hospital email phone')
      .populate('requestedDoctor', 'name specialization hospital email phone');

    if (!assistant) {
      return res.status(404).json({ success: false, message: 'Assistant not found.' });
    }

    res.status(200).json({
      success: true,
      message: doctorId
        ? `Assigned to Dr. ${doctor.name} successfully.`
        : 'Doctor unassigned successfully.',
      data: assistant,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Delete assistant (Admin only)
 * @route DELETE /api/assistants/:id
 * @access Private/Admin
 */
const deleteAssistant = async (req, res, next) => {
  try {
    const assistant = await Admin.findOneAndDelete({
      _id: req.params.id,
      role: 'assistant',
    });

    if (!assistant) {
      return res.status(404).json({ success: false, message: 'Assistant not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Assistant account deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Create a new assistant (Admin only)
 * @route POST /api/assistants
 * @access Private/Admin
 */
const createAssistant = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      age,
      gender,
      phone,
      requestedDoctor,
      requestedDoctorName,
      assignedDoctor,
      status,
      reason,
    } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const finalStatus = status || 'pending';

    const assistant = await Admin.create({
      name: name ? name.trim() : 'Assistant',
      email: email.toLowerCase().trim(),
      password: password || 'Assistant@123',
      age: age ? Number(age) : null,
      gender: gender || null,
      phone: phone ? phone.trim() : null,
      role: 'assistant',
      status: finalStatus,
      requestedDoctor: requestedDoctor || null,
      requestedDoctorName: requestedDoctorName || null,
      // Only approved assistants may have a doctor assigned
      assignedDoctor: finalStatus === 'approved' ? (assignedDoctor || null) : null,
      reason: reason ? reason.trim() : null,
    });

    const populated = await Admin.findById(assistant._id)
      .populate('assignedDoctor', 'name specialization hospital email phone')
      .populate('requestedDoctor', 'name specialization hospital email phone');

    res.status(201).json({
      success: true,
      message: 'Assistant created successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Update an assistant (Admin only)
 * @route PUT /api/assistants/:id
 * @access Private/Admin
 */
const updateAssistant = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      age,
      gender,
      phone,
      requestedDoctor,
      requestedDoctorName,
      assignedDoctor,
      status,
      reason,
    } = req.body;

    const assistant = await Admin.findOne({ _id: req.params.id, role: 'assistant' });
    if (!assistant) {
      return res.status(404).json({ success: false, message: 'Assistant not found.' });
    }

    if (name !== undefined) assistant.name = name.trim();
    if (email !== undefined) assistant.email = email.toLowerCase().trim();
    if (password) assistant.password = password; // triggers bcrypt pre('save')
    if (age !== undefined) assistant.age = age ? Number(age) : null;
    if (gender !== undefined) assistant.gender = gender;
    if (phone !== undefined) assistant.phone = phone;
    if (requestedDoctor !== undefined) assistant.requestedDoctor = requestedDoctor || null;
    if (requestedDoctorName !== undefined) assistant.requestedDoctorName = requestedDoctorName;
    if (assignedDoctor !== undefined) assistant.assignedDoctor = assignedDoctor || null;
    if (status !== undefined) assistant.status = status;
    if (reason !== undefined) assistant.reason = reason;

    // Only approved assistants may have a doctor assigned
    if (assistant.status !== 'approved') assistant.assignedDoctor = null;

    await assistant.save();

    const populated = await Admin.findById(assistant._id)
      .populate('assignedDoctor', 'name specialization hospital email phone')
      .populate('requestedDoctor', 'name specialization hospital email phone');

    res.status(200).json({
      success: true,
      message: 'Assistant updated successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssistants,
  createAssistant,
  updateAssistant,
  updateAssistantStatus,
  assignDoctor,
  deleteAssistant,
};
