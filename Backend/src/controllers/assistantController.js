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
    const { search = '', status = 'all' } = req.query;

    const filter = { role: 'assistant' };

    const cleanSearch = search.trim();
    if (cleanSearch) {
      const searchRegex = new RegExp(escapeRegex(cleanSearch), 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const [assistants, pendingCount, totalAssistants] = await Promise.all([
      Admin.find(filter)
        .populate('assignedDoctor', 'name specialization hospital email phone')
        .sort({ createdAt: -1 })
        .lean(),
      Admin.countDocuments({ role: 'assistant', status: 'pending' }),
      Admin.countDocuments({ role: 'assistant' }),
    ]);

    res.status(200).json({
      success: true,
      data: assistants,
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

    const assistant = await Admin.findOneAndUpdate(
      { _id: req.params.id, role: 'assistant' },
      { status },
      { new: true, runValidators: true }
    ).populate('assignedDoctor', 'name specialization hospital email phone');

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
    ).populate('assignedDoctor', 'name specialization hospital email phone');

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

module.exports = {
  getAssistants,
  updateAssistantStatus,
  assignDoctor,
  deleteAssistant,
};
