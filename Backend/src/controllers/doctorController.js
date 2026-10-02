const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { validationResult } = require('express-validator');
const { paginateResponse } = require('../utils/helpers');

/**
 * @desc  Get all doctors with search, filter, pagination
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
      startDate = '',
      endDate = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    // Full-text search (uses text index)
    if (search.trim()) {
      query.$text = { $search: search.trim() };
    }

    // Field filters
    if (specialization) query.specialization = new RegExp(specialization, 'i');
    if (hospital) query.hospital = new RegExp(hospital, 'i');

    // Date range filter
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

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .select('-patients')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Doctor.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      ...paginateResponse(doctors, total, page, limit),
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
 * @desc  Get patients assigned to a specific doctor
 * @route GET /api/doctors/:id/patients
 * @access Private
 */
const getDoctorPatients = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const doctor = await Doctor.findById(req.params.id).lean();
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const [patients, total] = await Promise.all([
      Patient.find({ assignedDoctor: req.params.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Patient.countDocuments({ assignedDoctor: req.params.id }),
    ]);

    res.status(200).json({
      success: true,
      doctor: { _id: doctor._id, name: doctor.name },
      ...paginateResponse(patients, total, page, limit),
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
  assignPatient,
  removePatient,
};
