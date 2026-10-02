const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { validationResult } = require('express-validator');
const { paginateResponse } = require('../utils/helpers');

/**
 * @desc  Get all patients with search, filter, pagination
 * @route GET /api/patients
 * @access Private
 */
const getPatients = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      condition = '',
      gender = '',
      assignedDoctor = '',
      startDate = '',
      endDate = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    // Full-text search
    if (search.trim()) {
      query.$text = { $search: search.trim() };
    }

    // Filters
    if (condition) query.condition = condition;
    if (gender) query.gender = gender;
    if (assignedDoctor) query.assignedDoctor = assignedDoctor;

    // Date range on createdAt
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [patients, total] = await Promise.all([
      Patient.find(query)
        .populate('assignedDoctor', 'name specialization')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Patient.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      ...paginateResponse(patients, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Get single patient by ID
 * @route GET /api/patients/:id
 * @access Private
 */
const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedDoctor', 'name specialization hospital phone email')
      .lean();

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Create a new patient
 * @route POST /api/patients
 * @access Private
 */
const createPatient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const patient = await Patient.create(req.body);

    // If a doctor is assigned, add patient to doctor's list
    if (patient.assignedDoctor) {
      await Doctor.findByIdAndUpdate(patient.assignedDoctor, {
        $addToSet: { patients: patient._id },
      });
    }

    res.status(201).json({ success: true, message: 'Patient created successfully.', data: patient });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Update a patient
 * @route PUT /api/patients/:id
 * @access Private
 */
const updatePatient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const oldPatient = await Patient.findById(req.params.id);
    if (!oldPatient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const oldDoctorId = oldPatient.assignedDoctor?.toString();
    const newDoctorId = req.body.assignedDoctor?.toString();

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Update doctor patient lists if doctor changed
    if (oldDoctorId !== newDoctorId) {
      if (oldDoctorId) {
        await Doctor.findByIdAndUpdate(oldDoctorId, {
          $pull: { patients: patient._id },
        });
      }
      if (newDoctorId) {
        await Doctor.findByIdAndUpdate(newDoctorId, {
          $addToSet: { patients: patient._id },
        });
      }
    }

    res.status(200).json({ success: true, message: 'Patient updated successfully.', data: patient });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Delete a patient
 * @route DELETE /api/patients/:id
 * @access Private
 */
const deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // Remove patient from doctor's list
    if (patient.assignedDoctor) {
      await Doctor.findByIdAndUpdate(patient.assignedDoctor, {
        $pull: { patients: patient._id },
      });
    }

    await Patient.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Patient deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Get patient condition enum values
 * @route GET /api/patients/conditions
 * @access Private
 */
const getConditions = async (req, res) => {
  res.status(200).json({
    success: true,
    data: Patient.schema.path('condition').enumValues,
  });
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getConditions,
};
