const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { validationResult } = require('express-validator');
const { paginateResponse, escapeRegex } = require('../utils/helpers');

/**
 * @desc  Get all doctors with smart multi-parameter search, filter, pagination
 * @route GET /api/doctors
 * @access Private
 */
const getDoctors = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      specialization = '',
      hospital = '',
      isActive = '',
      startDate = '',
      endDate = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (parsedPage - 1) * parsedLimit;

    const filterConditions = [];

    // =============================================
    // Smart multi-parameter search
    // Searches across: name, specialization, hospital, phone, email, bio
    // =============================================
    const cleanSearch = search.trim();
    if (cleanSearch) {
      const searchRegex = new RegExp(escapeRegex(cleanSearch), 'i');
      const searchOr = [
        { name: searchRegex },
        { specialization: searchRegex },
        { hospital: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { bio: searchRegex },
      ];

      // If search looks like a date (YYYY-MM-DD or YYYY-MM)
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanSearch)) {
        const sDate = new Date(cleanSearch);
        const eDate = new Date(cleanSearch);
        eDate.setHours(23, 59, 59, 999);
        searchOr.push({ createdAt: { $gte: sDate, $lte: eDate } });
      } else if (/^\d{4}-\d{2}$/.test(cleanSearch)) {
        const [y, m] = cleanSearch.split('-').map(Number);
        const sDate = new Date(y, m - 1, 1);
        const eDate = new Date(y, m, 0, 23, 59, 59, 999);
        searchOr.push({ createdAt: { $gte: sDate, $lte: eDate } });
      }

      filterConditions.push({ $or: searchOr });
    }

    // Specialization filter
    if (specialization && specialization !== 'all') {
      filterConditions.push({
        specialization: new RegExp(`^${escapeRegex(specialization.trim())}$`, 'i'),
      });
    }

    // Hospital filter
    if (hospital && hospital !== 'all') {
      filterConditions.push({
        hospital: new RegExp(escapeRegex(hospital.trim()), 'i'),
      });
    }

    // Active status filter
    if (isActive !== '' && isActive !== 'all') {
      filterConditions.push({ isActive: isActive === 'true' || isActive === true });
    }

    // Date range filter
    if (startDate || endDate) {
      const dateQuery = {};
      if (startDate) dateQuery.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
      filterConditions.push({ createdAt: dateQuery });
    }

    const query = filterConditions.length > 0 ? { $and: filterConditions } : {};

    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'specialization', 'hospital'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOptions = { [safeSortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Doctor.countDocuments(query),
    ]);

    // Attach accurate patientCount to each doctor
    const doctorsWithCount = doctors.map((doc) => ({
      ...doc,
      patientCount: Array.isArray(doc.patients) ? doc.patients.length : 0,
    }));

    res.status(200).json({
      success: true,
      ...paginateResponse(doctorsWithCount, total, parsedPage, parsedLimit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Get single doctor with patients
 * @route GET /api/doctors/:id
 * @access Private
 */
const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('patients', 'name age gender condition admissionDate phone email')
      .lean();

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Create a new doctor
 * @route POST /api/doctors
 * @access Private
 */
const createDoctor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const doctor = await Doctor.create(req.body);
    res.status(201).json({ success: true, message: 'Doctor created successfully.', data: doctor });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Update a doctor
 * @route PUT /api/doctors/:id
 * @access Private
 */
const updateDoctor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    res.status(200).json({ success: true, message: 'Doctor updated successfully.', data: doctor });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Delete a doctor
 * @route DELETE /api/doctors/:id
 * @access Private
 */
const deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Unassign patients from this doctor
    await Patient.updateMany(
      { assignedDoctor: req.params.id },
      { $set: { assignedDoctor: null } }
    );

    await Doctor.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Doctor deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Get patients assigned to a specific doctor with search, filters, pagination
 * @route GET /api/doctors/:id/patients
 * @access Private
 */
const getDoctorPatients = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      condition = '',
      startDate = '',
      endDate = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (parsedPage - 1) * parsedLimit;

    const doctor = await Doctor.findById(req.params.id).lean();
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const filterConditions = [{ assignedDoctor: req.params.id }];

    // Smart multi-parameter search within doctor's patients
    const cleanSearch = search.trim();
    if (cleanSearch) {
      const searchRegex = new RegExp(escapeRegex(cleanSearch), 'i');
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
      const numericVal = parseInt(cleanSearch, 10);
      if (!isNaN(numericVal) && String(numericVal) === cleanSearch) {
        searchOr.push({ age: numericVal });
      }
      filterConditions.push({ $or: searchOr });
    }

    // Condition filter
    if (condition && condition !== 'all') {
      filterConditions.push({ condition: condition.trim() });
    }

    // Date range filter
    if (startDate || endDate) {
      const dateQuery = {};
      if (startDate) dateQuery.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
      filterConditions.push({ createdAt: dateQuery });
    }

    const query = { $and: filterConditions };
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [patients, total] = await Promise.all([
      Patient.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Patient.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
      },
      ...paginateResponse(patients, total, parsedPage, parsedLimit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Get distinct doctor specializations for filtering
 * @route GET /api/doctors/specializations
 * @access Private
 */
const getSpecializations = async (req, res, next) => {
  try {
    const specializations = await Doctor.distinct('specialization');
    const cleaned = (specializations || [])
      .filter(Boolean)
      .map((s) => s.trim())
      .filter((s, idx, arr) => arr.indexOf(s) === idx)
      .sort();

    res.status(200).json({
      success: true,
      data: cleaned,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Assign a patient to a doctor
 * @route POST /api/doctors/:id/patients/:patientId
 * @access Private
 */
const assignPatient = async (req, res, next) => {
  try {
    const { id: doctorId, patientId } = req.params;

    const [doctor, patient] = await Promise.all([
      Doctor.findById(doctorId),
      Patient.findById(patientId),
    ]);

    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    // Avoid duplicate assignments
    if (doctor.patients.includes(patientId)) {
      return res.status(400).json({ success: false, message: 'Patient already assigned to this doctor.' });
    }

    doctor.patients.push(patientId);
    patient.assignedDoctor = doctorId;

    await Promise.all([doctor.save(), patient.save()]);

    res.status(200).json({ success: true, message: 'Patient assigned to doctor successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Remove a patient from a doctor
 * @route DELETE /api/doctors/:id/patients/:patientId
 * @access Private
 */
const removePatient = async (req, res, next) => {
  try {
    const { id: doctorId, patientId } = req.params;

    const [doctor, patient] = await Promise.all([
      Doctor.findById(doctorId),
      Patient.findById(patientId),
    ]);

    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    doctor.patients = doctor.patients.filter((p) => p.toString() !== patientId);
    patient.assignedDoctor = null;

    await Promise.all([doctor.save(), patient.save()]);

    res.status(200).json({ success: true, message: 'Patient removed from doctor successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorPatients,
  getSpecializations,
  assignPatient,
  removePatient,
};

