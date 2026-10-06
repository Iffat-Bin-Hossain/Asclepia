require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Admin = require('./src/models/Admin');
const Doctor = require('./src/models/Doctor');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/doctor_tracker';

const initialAssistants = [
  {
    name: 'Md. Arif Hossain',
    age: 28,
    gender: 'Male',
    phone: '01711-452831',
    email: 'arif.hossain@example.com',
    requestedDoctorName: 'Dr. Sakurul Islam',
    status: 'pending',
    reason: 'Wants to assist with orthopedic patient management',
  },
  {
    name: 'Sadia Rahman',
    age: 25,
    gender: 'Female',
    phone: '01819-637245',
    email: 'sadia.rahman@example.com',
    requestedDoctorName: 'Moynul Hasan',
    status: 'pending',
    reason: 'Interested in supporting clinical psychology sessions',
  },
  {
    name: 'Tanvir Ahmed',
    age: 31,
    gender: 'Male',
    phone: '01915-284763',
    email: 'tanvir.ahmed@example.com',
    requestedDoctorName: 'Dr. Fahmina Sobhan',
    status: 'pending',
    reason: 'ENT patient coordination and appointment support',
  },
  {
    name: 'Nusrat Jahan',
    age: 26,
    gender: 'Female',
    phone: '01624-719538',
    email: 'nusrat.jahan@example.com',
    requestedDoctorName: 'Dr. Bibi Joynab Rima',
    status: 'pending',
    reason: 'Pediatric patient assistance',
  },
  {
    name: 'Md. Rakib Hasan',
    age: 30,
    gender: 'Male',
    phone: '01318-562794',
    email: 'rakib.hasan@example.com',
    requestedDoctorName: 'Dr. Suman Chowdhury',
    status: 'pending',
    reason: 'Medicine department assistance',
  },
  {
    name: 'Farzana Akter',
    age: 27,
    gender: 'Female',
    phone: '01745-927316',
    email: 'farzana.akter@example.com',
    requestedDoctorName: 'Dr. Farzana Yasmin (Nimme)',
    status: 'pending',
    reason: 'Patient follow-up and documentation',
  },
  {
    name: 'Imran Kabir',
    age: 33,
    gender: 'Male',
    phone: '01837-415829',
    email: 'imran.kabir@example.com',
    requestedDoctorName: 'Dr. Md. Shafiqul Islam Dewan',
    status: 'pending',
    reason: 'Respiratory patient coordination',
  },
  {
    name: 'Jannatul Ferdous',
    age: 24,
    gender: 'Female',
    phone: '01928-746351',
    email: 'jannatul.ferdous@example.com',
    requestedDoctorName: 'Dr. M R Jahik Miah',
    status: 'pending',
    reason: 'ENT appointment and patient support',
  },
  {
    name: 'Md. Shakil Ahmed',
    age: 29,
    gender: 'Male',
    phone: '01618-395742',
    email: 'shakil.ahmed@example.com',
    requestedDoctorName: 'Dr. Md. Nazim Uddin',
    status: 'pending',
    reason: 'General patient assistance',
  },
  {
    name: 'Rifat Karim',
    age: 32,
    gender: 'Male',
    phone: '01309-824615',
    email: 'rifat.karim@example.com',
    requestedDoctorName: 'Dr. Akhlas Bhuiyan',
    status: 'pending',
    reason: 'Sports injury patient coordination',
  },
];

async function seedAssistants() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Seed Assistants] Connected to MongoDB Atlas');

    const salt = await bcrypt.genSalt(12);
    const defaultHashedPassword = await bcrypt.hash('Assistant@123', salt);

    for (const item of initialAssistants) {
      // Find doctor by requested doctor name
      const doctor = await Doctor.findOne({
        name: new RegExp(item.requestedDoctorName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i'),
      });

      const doctorId = doctor ? doctor._id : null;

      const assistantData = {
        name: item.name,
        email: item.email.toLowerCase(),
        age: item.age,
        gender: item.gender,
        phone: item.phone,
        role: 'assistant',
        status: item.status,
        requestedDoctor: doctorId,
        requestedDoctorName: item.requestedDoctorName,
        reason: item.reason,
      };

      const existing = await Admin.findOne({ email: item.email.toLowerCase() });
      if (!existing) {
        assistantData.password = defaultHashedPassword;
        await Admin.create(assistantData);
        console.log(`[Seed Assistants] Created assistant: ${item.name} (${item.email}) -> Requested: ${item.requestedDoctorName}`);
      } else {
        await Admin.findByIdAndUpdate(existing._id, { $set: assistantData });
        console.log(`[Seed Assistants] Updated assistant: ${item.name} (${item.email}) -> Requested: ${item.requestedDoctorName}`);
      }
    }

    const totalAssistants = await Admin.countDocuments({ role: 'assistant' });
    const pendingAssistants = await Admin.countDocuments({ role: 'assistant', status: 'pending' });
    console.log(`[Seed Assistants] Total Assistants: ${totalAssistants}, Pending: ${pendingAssistants}`);

    process.exit(0);
  } catch (error) {
    console.error('[Seed Assistants Error]', error);
    process.exit(1);
  }
}

seedAssistants();
