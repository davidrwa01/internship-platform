import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/internship-platform');
    console.log('Connected to MongoDB');

    // Check if admin with the desired email already exists
    const adminEmail = 'admin@platform.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = new User({
      fullName: 'System Administrator',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      active: true,
      phone: '+1234567890'
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@platform.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createAdmin();
