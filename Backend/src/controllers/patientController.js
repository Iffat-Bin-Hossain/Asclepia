const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const { paginateResponse, escapeRegex } = require('../utils/helpers');

/**
 * @desc  Get all patients with smart multi-parameter search, filters, pagination
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
      dateType = 'createdAt', // 'createdAt' or 'admissionDate'
      startDate = '',
      endDate = '',
      minAge = '',
      maxAge = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (parsedPage - 1) * parsedLimit;

    const filterConditions = [];

    // =============================================
    // Smart multi-parameter search
    // Searches across: name, email, phone, condition,
    // gender, diagnosis, address, notes, age,
    // and assigned doctor name/specialization/hospital/phone/email
    // =============================================
    const cleanSearch = search.trim();
    if (cleanSearch) {
      const searchRegex = new RegExp(escapeRegex(cleanSearch), 'i');

      // Check if any doctors match this search term
      const matchingDoctors = await Doctor.find({
        $or: [
          { name: searchRegex },
          { specialization: searchRegex },
          { hospital: searchRegex },
          { phone: searchRegex },
          { email: searchRegex },
        ],
      })
        .select('_id')
        .lean();

      const matchingDoctorIds = matchingDoctors.map((d) => d._id);

      const searchOr = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { condition: searchRegex },
        { gender: searchRegex },
        { diagnosis: searchRegex },
        { address: searchRegex },
        { notes: searchRegex },
      ];

      // If search query is a number, match exact age as well
      const numericVal = parseInt(cleanSearch, 10);
      if (!isNaN(numericVal) && String(numericVal) === cleanSearch) {
        searchOr.push({ age: numericVal });
      }

      // If search query is a date (YYYY-MM-DD or YYYY-MM)
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanSearch)) {
        const sDate = new Date(cleanSearch);
        const eDate = new Date(cleanSearch);
        eDate.setHours(23, 59, 59, 999);
        searchOr.push(
          { createdAt: { $gte: sDate, $lte: eDate } },
          { admissionDate: { $gte: sDate, $lte: eDate } }
        );
      } else if (/^\d{4}-\d{2}$/.test(cleanSearch)) {
        const [y, m] = cleanSearch.split('-').map(Number);
        const sDate = new Date(y, m - 1, 1);
        const eDate = new Date(y, m, 0, 23, 59, 59, 999);
        searchOr.push(
          { createdAt: { $gte: sDate, $lte: eDate } },
          { admissionDate: { $gte: sDate, $lte: eDate } }
        );
      }

      // If any doctor matched, include patients assigned to those doctors
      if (matchingDoctorIds.length > 0) {
        searchOr.push({ assignedDoctor: { $in: matchingDoctorIds } });
      }

      filterConditions.push({ $or: searchOr });
    }

    // Condition filter (single or comma-separated)
    if (condition && condition !== 'all') {
      if (condition.includes(',')) {
        const conditionsList = condition.split(',').map((c) => c.trim()).filter(Boolean);
        filterConditions.push({ condition: { $in: conditionsList } });
      } else {
        filterConditions.push({ condition: condition.trim() });
      }
    }

    // Gender filter
    if (gender && gender !== 'all') {
      filterConditions.push({ gender: gender.trim() });
    }

    // Assigned Doctor filter
    if (assignedDoctor && assignedDoctor !== 'all') {
      if (assignedDoctor === 'unassigned') {
        filterConditions.push({
          $or: [
            { assignedDoctor: null },
            { assignedDoctor: { $exists: false } },
          ],
        });
      } else if (assignedDoctor === 'assigned') {
        filterConditions.push({
          assignedDoctor: { $ne: null, $exists: true },
        });
      } else if (mongoose.Types.ObjectId.isValid(assignedDoctor)) {
        filterConditions.push({ assignedDoctor: new mongoose.Types.ObjectId(assignedDoctor) });
      }
    }

    // Age range filters
    if (minAge !== '' || maxAge !== '') {
      const ageQuery = {};
      if (minAge !== '') ageQuery.$gte = parseInt(minAge, 10);
      if (maxAge !== '') ageQuery.$lte = parseInt(maxAge, 10);
      filterConditions.push({ age: ageQuery });
    }

    // Date range filter (dateType = 'createdAt' or 'admissionDate')
    if (startDate || endDate) {
      const targetDateField = dateType === 'admissionDate' ? 'admissionDate' : 'createdAt';
      const dateQuery = {};
      if (startDate) dateQuery.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
      filterConditions.push({ [targetDateField]: dateQuery });
    }

    const query = filterConditions.length > 0 ? { $and: filterConditions } : {};

    // Validate sortBy field
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'age', 'condition', 'admissionDate'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOptions = { [safeSortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [patients, total] = await Promise.all([
      Patient.find(query)
        .populate('assignedDoctor', 'name specialization hospital email phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Patient.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      ...paginateResponse(patients, total, parsedPage, parsedLimit),
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
