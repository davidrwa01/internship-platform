import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const updateAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tvt');
    console.log('Connected to MongoDB');

    // Find the user by email and update to admin
    const userEmail = 'davidrwa4@gmail.com';
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log(`User with email ${userEmail} not found.`);
    } else {
      user.role = 'admin';
      user.active = true;
      await user.save();
      console.log(`User ${userEmail} updated to admin role successfully!`);
      console.log('Role:', user.role);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

updateAdmin();
