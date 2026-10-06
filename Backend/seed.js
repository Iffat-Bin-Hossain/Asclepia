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

    const totalDocs = await Doctor.countDocuments();
    console.log(`[Seed] Total doctors active in database: ${totalDocs}`);

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error.message);
    process.exit(1);
  }
};

seed();
