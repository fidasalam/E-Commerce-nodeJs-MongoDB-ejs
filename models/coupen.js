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
 
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
