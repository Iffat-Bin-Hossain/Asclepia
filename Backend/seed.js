require('dotenv').config();
const mongoose = require('mongoose');

const Admin = require('./src/models/Admin');
const Doctor = require('./src/models/Doctor');
const Patient = require('./src/models/Patient');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/doctor_tracker';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear all existing data (dummy doctors, patients, analytics, previous admins)
    await Promise.all([
      Admin.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
    ]);
    console.log('🗑️  Cleared all dummy data: doctors and patients completely wiped');

    // Create the clean administrator account
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@asclepia.health';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    const admin = await Admin.create({
      email: adminEmail,
      password: adminPassword,
      name: 'Admin',
      role: 'admin',
    });
    console.log(`✅ System Admin initialized: ${admin.email}`);

    console.log('\n✨ Clean Database Setup Complete:');
    console.log(`   • Doctors: 0 (clean registry)`);
    console.log(`   • Patients: 0 (clean registry)`);
    console.log(`   • Analytics/Graphs: Clean zero baseline`);
    console.log(`\n📧 Admin Login Credentials:`);
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seed();

