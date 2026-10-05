const express = require('express');
const { body } = require('express-validator');
const {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorPatients,
  getSpecializations,
  assignPatient,
  removePatient,
} = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const doctorValidation = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('specialization').notEmpty().withMessage('Specialization is required'),
  body('hospital').notEmpty().withMessage('Hospital is required'),
  body('phone')
    .notEmpty().withMessage('Phone is required')
    .matches(/^[\+]?[\d\s\-\(\)]{7,20}$/).withMessage('Invalid phone number'),
  body('email')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
];

// All routes protected
router.use(protect);

// Meta / filters
router.get('/specializations', getSpecializations);

// CRUD
router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.post('/', doctorValidation, createDoctor);
router.put('/:id', doctorValidation, updateDoctor);
router.delete('/:id', deleteDoctor);

// Patient management for a doctor
router.get('/:id/patients', getDoctorPatients);
router.post('/:id/patients/:patientId', assignPatient);
router.delete('/:id/patients/:patientId', removePatient);

module.exports = router;
