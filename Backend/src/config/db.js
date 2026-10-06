const mongoose = require('mongoose');

const connectDB = async (retries = 5, delay = 2000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/doctor_tracker', {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(`[Database] Connection Attempt ${i}/${retries} Error: ${error.message}`);
      if (i < retries) {
        console.log(`[Database] Retrying MongoDB connection in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error('[Database] Could not connect to MongoDB after multiple attempts. Exiting...');
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;

