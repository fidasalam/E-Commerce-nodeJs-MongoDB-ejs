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
  shippingAddresses: [{  // Make shippingAddress an array of objects
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
    default: { type: Boolean, default: false }
  }],
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
  otp:{
    type:String,
    default: '0000'
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
