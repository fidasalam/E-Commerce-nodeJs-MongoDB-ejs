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

  shippingAddress: {
    street: {
      type: String,
    
    },
    city: {
      type: String,
      
    },
    state: {
      type: String,
      
    },
    postalCode: {
      type: String,
    
    },
  },

    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart',
      
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wishlist'
      }
    ],
  
    // Add more address fields as needed
  
});





const User = mongoose.model('User', userSchema);

module.exports = User;
