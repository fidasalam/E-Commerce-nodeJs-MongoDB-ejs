// db.js
const mongoose = require('mongoose');
const logger = require('../util/winston');

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING, {
      useNewUrlParser: true,
    
    });
    logger.info('Database Connection Established');
    console.log('Database Connection Established');

    
  } catch (error) {
    console.error('Database Connection Error:', error);
    throw error;
  }
}

module.exports = connectToDatabase;
