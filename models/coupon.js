const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    validityPeriod: {
        type: Date,
        required: true,
    },
    description:{
        type: String,
         required: true,
    },
    validProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      }],
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
