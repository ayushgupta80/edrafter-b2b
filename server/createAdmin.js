const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();


async function createAdmin() {
  try {
   
    // Create admin user
    const admin = new User({
      name: "Admin",
      company: "eDrafterb2b",
      email: "admin@edrafterb2b.in",
      phone: "1234567890",
      userId: "2",
      password: "eD%admin-007", // Will be hashed automatically
      isAdmin: true,
      // Add other required fields
    });

    await admin.save();
    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();