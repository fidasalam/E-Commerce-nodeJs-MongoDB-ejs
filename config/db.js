// db.js
const mongoose = require('mongoose');

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Database Connection Established');
  } catch (error) {
    console.error('Database Connection Error:', error);
    throw error;
  }
}

module.exports = connectToDatabase;
