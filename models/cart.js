const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 1 ,
  },
   size: {
    type: String,
   enum: ['small', 'medium', 'large']
  },
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default:null
  },
  items: {
    type: [cartItemSchema],
    default: [] 
  },
   totalPrice: {
   type: Number,
     default: 0
  },
  appliedCoupon: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Coupon', 
    default: null },


});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
