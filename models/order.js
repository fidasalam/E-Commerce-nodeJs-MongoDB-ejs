const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  // size: {
  //   type: String,
  //   enum: ['small', 'medium', 'large']
  // },
  // itemPrice: {
  //   type: Number,
  //   required: true
  // },
});

const orderSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: {
    type: [orderItemSchema],
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  appliedCoupon: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Coupon', 
    default: null
   },

  shippingAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    postalCode: {
      type: String,
      required: true
    },

    // Add more address fields as needed
  },

  payment: {
    orderId: {
      type: String,
      default: '',
    },
    paymentId: {
      type: String,
      default: '',
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    shippedDate: {
      type: Date,
      default: null,
    },
    deliveredDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      default: 'pending',
    },
  },

  
  // Add more fields as needed
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
