const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
  
    images: [{
        type: String,
        required: true,
    }],
    category: {
    
        type: mongoose.Schema.Types.ObjectId,
         ref: 'Category', 
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        enum: ['red', 'black', 'white', 'green', 'blue', 'yellow', 'grey'],
        required: true,
    },
    size: {
        type: String,
        enum: ['S', 'M', 'L', 'XL'],
        required: true,
    },
    unitsSold: {
        type: Number,
        default: 0,
    },
    inStock: {
        type: Number,
        default: 0,
        min:0
    },
    isFeatured:{
        type:Boolean,
        default:false,
    },
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null,
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
})


module.exports = mongoose.model('Product', productSchema);
