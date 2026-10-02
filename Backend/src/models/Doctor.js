const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    hospital: {
      type: String,
      required: [true, 'Hospital is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[\+]?[\d\s\-\(\)]{7,20}$/, 'Please enter a valid phone number'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    patients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// =============================================
// Compound Indexes for optimized queries
// =============================================
DoctorSchema.index({ name: 'text', specialization: 'text', hospital: 'text' });
DoctorSchema.index({ createdAt: -1 });
DoctorSchema.index({ name: 1, createdAt: -1 });
DoctorSchema.index({ specialization: 1 });
DoctorSchema.index({ hospital: 1 });
DoctorSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Doctor', DoctorSchema);
