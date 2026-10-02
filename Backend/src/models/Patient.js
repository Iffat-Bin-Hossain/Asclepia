const mongoose = require('mongoose');

const PATIENT_CONDITIONS = [
  'Critical',
  'Serious',
  'Stable',
  'Fair',
  'Good',
  'Recovered',
  'Under Observation',
  'Discharged',
];

const PatientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [150, 'Age cannot exceed 150'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: PATIENT_CONDITIONS,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\+]?[\d\s\-\(\)]{7,20}$/, 'Please enter a valid phone number'],
      default: '',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
      default: '',
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters'],
      default: '',
    },
    diagnosis: {
      type: String,
      trim: true,
      maxlength: [500, 'Diagnosis cannot exceed 500 characters'],
      default: '',
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    dischargeDate: {
      type: Date,
      default: null,
    },
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// =============================================
// Compound Indexes for optimized queries
// =============================================
PatientSchema.index({ name: 'text', diagnosis: 'text', address: 'text' });
PatientSchema.index({ createdAt: -1 });
PatientSchema.index({ condition: 1, createdAt: -1 });
PatientSchema.index({ assignedDoctor: 1, createdAt: -1 });
PatientSchema.index({ admissionDate: -1 });
PatientSchema.index({ gender: 1 });
PatientSchema.index({ condition: 1, assignedDoctor: 1 });

// Export condition enum for reuse in validation
PatientSchema.statics.CONDITIONS = PATIENT_CONDITIONS;

module.exports = mongoose.model('Patient', PatientSchema);
