require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Admin = require('./src/models/Admin');
const Doctor = require('./src/models/Doctor');
const Patient = require('./src/models/Patient');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/doctor_tracker';

const sampleDoctors = [
  { name: 'Dr. Sarah Mitchell', specialization: 'Cardiology', hospital: 'City General Hospital', phone: '+1-555-0101', email: 'sarah.mitchell@citygeneral.com', bio: 'Experienced cardiologist with 15+ years of practice.' },
  { name: 'Dr. James Okafor', specialization: 'Neurology', hospital: 'Metro Medical Center', phone: '+1-555-0102', email: 'james.okafor@metromedical.com', bio: 'Specialist in neurological disorders and brain surgery.' },
  { name: 'Dr. Priya Sharma', specialization: 'Pediatrics', hospital: "St. Mary's Children Hospital", phone: '+1-555-0103', email: 'priya.sharma@stmarys.com', bio: 'Dedicated pediatrician focused on child health and wellness.' },
  { name: 'Dr. Marcus Webb', specialization: 'Orthopedics', hospital: 'Sports Medicine Clinic', phone: '+1-555-0104', email: 'marcus.webb@sportsmed.com', bio: 'Expert in sports injuries and joint replacement surgery.' },
  { name: 'Dr. Elena Vasquez', specialization: 'Dermatology', hospital: 'Skin Care Institute', phone: '+1-555-0105', email: 'elena.vasquez@skincare.com', bio: 'Specializes in skin conditions and cosmetic dermatology.' },
];

const generatePatients = (doctors) => [
  { name: 'Alice Johnson', age: 45, gender: 'Female', condition: 'Stable', phone: '+1-555-1001', email: 'alice.j@email.com', diagnosis: 'Hypertension', assignedDoctor: doctors[0]._id },
  { name: 'Bob Williams', age: 62, gender: 'Male', condition: 'Critical', phone: '+1-555-1002', email: 'bob.w@email.com', diagnosis: 'Acute Myocardial Infarction', assignedDoctor: doctors[0]._id },
  { name: 'Carol Davis', age: 38, gender: 'Female', condition: 'Good', phone: '+1-555-1003', email: 'carol.d@email.com', diagnosis: 'Migraine', assignedDoctor: doctors[1]._id },
  { name: 'David Martinez', age: 55, gender: 'Male', condition: 'Serious', phone: '+1-555-1004', email: 'david.m@email.com', diagnosis: 'Epilepsy', assignedDoctor: doctors[1]._id },
  { name: 'Emma Thompson', age: 8, gender: 'Female', condition: 'Stable', phone: '+1-555-1005', email: 'emma.t@email.com', diagnosis: 'Asthma', assignedDoctor: doctors[2]._id },
  { name: 'Frank Wilson', age: 34, gender: 'Male', condition: 'Good', phone: '+1-555-1006', email: 'frank.w@email.com', diagnosis: 'ACL Tear', assignedDoctor: doctors[3]._id },
  { name: 'Grace Lee', age: 29, gender: 'Female', condition: 'Recovered', phone: '+1-555-1007', email: 'grace.l@email.com', diagnosis: 'Eczema', assignedDoctor: doctors[4]._id },
  { name: 'Henry Brown', age: 71, gender: 'Male', condition: 'Fair', phone: '+1-555-1008', email: 'henry.b@email.com', diagnosis: 'Arrhythmia', assignedDoctor: doctors[0]._id },
  { name: 'Iris Chen', age: 5, gender: 'Female', condition: 'Stable', phone: '+1-555-1009', email: 'iris.c@email.com', diagnosis: 'Fever & Infection', assignedDoctor: doctors[2]._id },
  { name: 'Jack Robinson', age: 48, gender: 'Male', condition: 'Under Observation', phone: '+1-555-1010', email: 'jack.r@email.com', diagnosis: 'Lumbar Disc Herniation', assignedDoctor: doctors[3]._id },
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Admin.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create admin
    const admin = await Admin.create({
      email: process.env.ADMIN_EMAIL || 'admin@doctortracker.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      name: 'System Administrator',
    });
    console.log(`✅ Admin created: ${admin.email}`);

    // Create doctors
    const doctors = await Doctor.insertMany(sampleDoctors);
    console.log(`✅ Created ${doctors.length} doctors`);

    // Create patients with doctor assignments
    const patientData = generatePatients(doctors);
    const patients = await Patient.insertMany(patientData);
    console.log(`✅ Created ${patients.length} patients`);

    // Update doctor patient arrays
    for (const patient of patients) {
      if (patient.assignedDoctor) {
        await Doctor.findByIdAndUpdate(patient.assignedDoctor, {
          $addToSet: { patients: patient._id },
        });
      }
    }
    console.log('✅ Doctor-Patient relationships established');

    console.log('\n🎉 Database seeded successfully!');
    console.log(`\n📧 Admin Login:\n  Email: ${process.env.ADMIN_EMAIL || 'admin@doctortracker.com'}\n  Password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seed();
