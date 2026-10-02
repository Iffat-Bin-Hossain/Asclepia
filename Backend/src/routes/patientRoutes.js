const express = require('express');
const { body } = require('express-validator');
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getConditions,
} = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const PATIENT_CONDITIONS = [
  'Critical', 'Serious', 'Stable', 'Fair',
  'Good', 'Recovered', 'Under Observation', 'Discharged',
];

// Validation rules
const patientValidation = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('age')
    .isInt({ min: 0, max: 150 }).withMessage('Age must be 0-150'),
  body('gender')
    .isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('condition')
    .isIn(PATIENT_CONDITIONS).withMessage('Invalid condition'),
];

// All routes protected
router.use(protect);

// Meta
router.get('/conditions', getConditions);

// CRUD
router.get('/', getPatients);
router.get('/:id', getPatientById);
router.post('/', patientValidation, createPatient);
router.put('/:id', patientValidation, updatePatient);
router.delete('/:id', deletePatient);

module.exports = router;
