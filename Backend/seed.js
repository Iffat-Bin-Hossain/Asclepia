require('dotenv').config();
const mongoose = require('mongoose');

const Admin = require('./src/models/Admin');
const Doctor = require('./src/models/Doctor');
const Patient = require('./src/models/Patient');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/doctor_tracker';

const initialDoctors = [
  {
    name: 'Dr. Kakon Kumar Dey',
    specialization: 'Psychiatry, Mental Diseases, Addiction, Sexual Medicine',
    hospital: 'Modern Hospital Private Limited, Cumilla',
    phone: '+8801711723071',
    email: 'kakon.dey@modernhospital.com',
    bio: 'BMDC Reg. No: A-72307 | Exp: 13+ years | MBBS, BCS, MD (Psychiatry), Advanced Training in Sexual Medicine, Addiction & Psychotherapy. Consultant Psychiatrist.',
    isActive: true,
  },
  {
    name: 'Dr. Akhlas Bhuiyan',
    specialization: 'Orthopaedics, Arthroscopy, Arthroplasty, Sports Injury',
    hospital: 'Al Haramain Hospital Ltd, Sylhet',
    phone: '+8801711643652',
    email: 'akhlas.bhuiyan@alharamain.com',
    bio: 'BMDC Reg. No: A-64365 | Exp: 5+ years | MBBS, MS (Orthopaedics), Arthroscopy & Arthroplasty Fellow (India/DAAA). Consultant.',
    isActive: true,
  },
  {
    name: 'Dr. Md. Nazim Uddin',
    specialization: 'General Medicine, Diabetes & Surgery',
    hospital: 'Delta Medical College & Hospital, Dhaka',
    phone: '+8801711026023',
    email: 'nazim.uddin@deltamedical.com',
    bio: 'BMDC Reg. No: A-102602 | MBBS, CCD (BIRDEM), PGT (Surgery). Ex-Registrar (Surgery).',
    isActive: true,
  },
  {
    name: 'Dr. M R Jahik Miah',
    specialization: 'ENT, Head & Neck Surgery',
    hospital: 'Kaitak Hospital, Chhatak, Sunamganj',
    phone: '+8801711938414',
    email: 'jahik.miah@kaitakhospital.com',
    bio: 'BMDC Reg. No: A-93841 | Exp: 7+ years | MBBS (SOMC), BCS (Health), DLO (BMU), FCPS (ENT, Final Part). Medical Officer.',
    isActive: true,
  },
  {
    name: 'Dr. Suman Chowdhury',
    specialization: 'Medicine',
    hospital: 'Chittagong Medical College & Hospital',
    phone: '+8801711441115',
    email: 'suman.chowdhury@cmch.gov.bd',
    bio: 'BMDC Reg. No: A-44111 | Exp: 15+ years | MBBS (CMC), FCPS (Medicine), FACP (USA). Consultant (Medicine).',
    isActive: true,
  },
  {
    name: 'Dr. Farzana Yasmin (Nimme)',
    specialization: 'Medicine',
    hospital: 'Sylhet MAG Osmani Medical College & Hospital',
    phone: '+8801711817676',
    email: 'farzana.yasmin@magosmani.gov.bd',
    bio: 'BMDC Reg. No: A-81767 | Exp: 9+ years | MBBS, BCS (Health), FCPS (Medicine). Department of Medicine.',
    isActive: true,
  },
  {
    name: 'Dr. Bibi Joynab Rima',
    specialization: 'Newborn, Adolescent & Child Diseases',
    hospital: 'Chattogram Medical College & Hospital',
    phone: '+8801711717367',
    email: 'joynab.rima@cmch.gov.bd',
    bio: 'BMDC Reg. No: A-71736 | Exp: 10+ years | MBBS, BCS (Health), FCPS (Pediatrics). Assistant Registrar (Pediatrics).',
    isActive: true,
  },
  {
    name: 'Dr. Md. Shafiqul Islam Dewan',
    specialization: 'Chest Diseases, Respiratory Medicine, Interventional Pulmonology',
    hospital: 'National Institute of Diseases of the Chest & Hospital (NIDCH)',
    phone: '+8801711637528',
    email: 'shafiqul.dewan@nidch.gov.bd',
    bio: 'BMDC Reg. No: A-63752 | Exp: 13+ years | MBBS, BCS (Health), MD (Pulmonology), MACP (USA), specialized training in Bronchoscopy, Pleuroscopy & USG procedures.',
    isActive: true,
  },
  {
    name: 'Dr. Fahmina Sobhan',
    specialization: 'ENT, Head & Neck Surgery',
    hospital: 'USTC Medical College, Chittagong',
    phone: '+8801711605139',
    email: 'fahmina.sobhan@ustc.edu.bd',
    bio: 'BMDC Reg. No: A-60513 | Exp: 5+ years | MBBS, DLO (ENT), CCD (BIRDEM), training in Endoscopic Sinus & Laser ENT Surgery. Assistant Professor (ENT & HNS).',
    isActive: true,
  },
  {
    name: 'Moynul Hasan',
    specialization: 'Clinical Psychology, Psychotherapy',
    hospital: 'Grameen Health Tech Ltd (Shukhee)',
    phone: '+8801711005510',
    email: 'moynul.hasan@shukhee.com',
    bio: 'BMDC Reg: Non-Medical Psychologist | Exp: 5+ years | B.Sc. & M.S. in Clinical Psychology (University of Rajshahi), training in CBT, DBT, ABA, Psychological Assessment, Child & Adolescent Intervention & Telepsychotherapy.',
    isActive: true,
  },
  {
    name: 'Dr. Sakurul Islam',
    specialization: 'Orthopaedic, Arthroscopic & Trauma Surgery',
    hospital: 'Lancet Hospital Limited & Lancet Diagnostic Center Limited, Chattogram',
    phone: '+8801711601601',
    email: 'sakurul.islam@lancethospital.com',
    bio: 'BMDC Reg. No: A-60160 | MBBS, MS (Orthopedic Surgery), PhD (Orthopedic Surgery), Master Class in Knee & Shoulder Arthroscopy. Director.',
    isActive: true,
  },
];

const initialPatients = [
  {
    name: 'Md. Rahat Hossain',
    age: 42,
    gender: 'Male',
    condition: 'Stable',
    doctorEmail: 'sakurul.islam@lancethospital.com',
    phone: '01712-458921',
    email: 'rahat.hossain@example.com',
    diagnosis: 'Knee Osteoarthritis',
    address: 'Mirpur, Dhaka',
    notes: 'Chronic knee pain with difficulty walking. Recommended X-ray and orthopedic follow-up.',
  },
  {
    name: 'Nusrat Jahan',
    age: 27,
    gender: 'Female',
    condition: 'Fair',
    doctorEmail: 'moynul.hasan@shukhee.com',
    phone: '01819-673245',
    email: 'nusrat.jahan@example.com',
    diagnosis: 'Anxiety Disorder',
    address: 'Dhanmondi, Dhaka',
    notes: 'Reports persistent anxiety and sleep difficulty. Scheduled for psychotherapy assessment.',
  },
  {
    name: 'Tanvir Ahmed',
    age: 35,
    gender: 'Male',
    condition: 'Good',
    doctorEmail: 'fahmina.sobhan@ustc.edu.bd',
    phone: '01915-284763',
    email: 'tanvir.ahmed@example.com',
    diagnosis: 'Chronic Sinusitis',
    address: 'Agrabad, Chattogram',
    notes: 'Recurrent nasal congestion and facial pressure. ENT evaluation advised.',
  },
  {
    name: 'Md. Shakil Mia',
    age: 58,
    gender: 'Male',
    condition: 'Serious',
    doctorEmail: 'shafiqul.dewan@nidch.gov.bd',
    phone: '01624-839517',
    email: 'shakil.mia@example.com',
    diagnosis: 'Chronic Obstructive Pulmonary Disease',
    address: 'Uttara, Dhaka',
    notes: 'Shortness of breath with exertion and chronic cough. Under respiratory evaluation.',
  },
  {
    name: 'Ayesha Rahman',
    age: 8,
    gender: 'Female',
    condition: 'Stable',
    doctorEmail: 'joynab.rima@cmch.gov.bd',
    phone: '01318-562794',
    email: 'ayesha.rahman@example.com',
    diagnosis: 'Acute Bronchitis',
    address: 'Sylhet City, Sylhet',
    notes: 'Cough and mild fever for several days. Hydration and pediatric follow-up advised.',
  },
  {
    name: 'Farhana Akter',
    age: 46,
    gender: 'Female',
    condition: 'Fair',
    doctorEmail: 'farzana.yasmin@magosmani.gov.bd',
    phone: '01745-927316',
    email: 'farhana.akter@example.com',
    diagnosis: 'Type 2 Diabetes Mellitus',
    address: 'Zindabazar, Sylhet',
    notes: 'Elevated blood glucose reported. Medication review and glucose monitoring advised.',
  },
  {
    name: 'Md. Kamal Uddin',
    age: 61,
    gender: 'Male',
    condition: 'Under Observation',
    doctorEmail: 'suman.chowdhury@cmch.gov.bd',
    phone: '01837-415829',
    email: 'kamal.uddin@example.com',
    diagnosis: 'Hypertension',
    address: 'Panchlaish, Chattogram',
    notes: 'Elevated blood pressure on examination. Monitoring and medication adjustment under consideration.',
  },
  {
    name: 'Sadia Islam',
    age: 31,
    gender: 'Female',
    condition: 'Good',
    doctorEmail: 'jahik.miah@kaitakhospital.com',
    phone: '01928-746351',
    email: 'sadia.islam@example.com',
    diagnosis: 'Allergic Rhinitis',
    address: 'Sunamganj Sadar, Sunamganj',
    notes: 'Sneezing, nasal irritation and intermittent congestion. ENT consultation completed.',
  },
  {
    name: 'Md. Nazmul Hasan',
    age: 50,
    gender: 'Male',
    condition: 'Stable',
    doctorEmail: 'nazim.uddin@deltamedical.com',
    phone: '01618-395742',
    email: 'nazmul.hasan@example.com',
    diagnosis: 'Type 2 Diabetes with Gastritis',
    address: 'Uttara, Dhaka',
    notes: 'Follow-up for diabetes management with intermittent gastric discomfort.',
  },
  {
    name: 'Rafiul Karim',
    age: 24,
    gender: 'Male',
    condition: 'Good',
    doctorEmail: 'akhlas.bhuiyan@alharamain.com',
    phone: '01309-824615',
    email: 'rafiul.karim@example.com',
    diagnosis: 'Sports-related Ankle Injury',
    address: 'Sylhet Sadar, Sylhet',
    notes: 'Ankle pain following a sports injury. Advised rest, imaging if symptoms persist, and orthopedic follow-up.',
  },
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected to MongoDB');

    // Create or update admin account
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@asclepia.health';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      admin = await Admin.create({
        email: adminEmail,
        password: adminPassword,
        name: 'Admin',
        role: 'admin',
      });
      console.log(`[Seed] System Admin initialized: ${admin.email}`);
    } else {
      console.log(`[Seed] System Admin exists: ${admin.email}`);
    }

    // Insert or update the 11 registered clinical doctors
    for (const doc of initialDoctors) {
      await Doctor.findOneAndUpdate({ email: doc.email }, { $set: doc }, { upsert: true, new: true });
    }
    console.log(`[Seed] Seeded ${initialDoctors.length} clinical doctors into database.`);

    // Insert or update the 10 patients and link them to doctors
    for (const p of initialPatients) {
      const doctor = await Doctor.findOne({ email: p.doctorEmail });
      const doctorId = doctor ? doctor._id : null;
      const patientData = {
        name: p.name,
        age: p.age,
        gender: p.gender,
        condition: p.condition,
        assignedDoctor: doctorId,
        phone: p.phone,
        email: p.email,
        diagnosis: p.diagnosis,
        address: p.address,
        notes: p.notes,
        admissionDate: new Date(),
      };

      const patient = await Patient.findOneAndUpdate(
        { email: p.email },
        { $set: patientData },
        { upsert: true, new: true }
      );

      if (doctorId) {
        await Doctor.findByIdAndUpdate(doctorId, {
          $addToSet: { patients: patient._id },
        });
      }
    }
    console.log(`[Seed] Seeded ${initialPatients.length} patients and linked to doctors.`);

    const totalDocs = await Doctor.countDocuments();
    const totalPatients = await Patient.countDocuments();
    console.log(`[Seed] Total doctors: ${totalDocs}, Total patients: ${totalPatients}`);

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error.message);
    process.exit(1);
  }
};

seed();
