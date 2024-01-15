const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // You can have different roles
    default: 'user'
  },
  
  name: {
    type: String,
    trim: true
  },
  phone:{
    type:Number,
    trim:true
  },

  address: {
    
      type: String,
      trim: true
    },
    // Add more address fields as needed
  
});





const User = mongoose.model('User', userSchema);

module.exports = User;
