// addAdmin.js
const mongoose = require('mongoose');
require('dotenv/config');
const bcrypt = require('bcrypt');
const User = require('./models/usermodel'); // Adjust the path as needed

async function addAdmin() {
  try {
    // Connect to the database
    await mongoose.connect(process.env.CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Check if an admin user already exists
    const adminExists = await User.exists({ role: 'admin' });

    if (!adminExists) {
      // Create a hashed password for the admin user
      const hashedPassword = await bcrypt.hash('admin_password', 10);

      // Create the admin user
      const adminUser = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: 123,
        role: 'admin',
        name: 'Admin User',
        phone: 1234567890,
        address: { street: '123 Admin Street', city: 'Admin City' }
      });

      // Save the admin user to the database
      await adminUser.save();

      console.log('Admin user added successfully.');
    } else {
      console.log('Admin user already exists in the database.');
    }
  } catch (error) {
    console.error('Error adding admin user:', error);
  } finally {
    // Disconnect from the database
    await mongoose.disconnect();
  }
}

// Call the function to add an admin user
addAdmin();
