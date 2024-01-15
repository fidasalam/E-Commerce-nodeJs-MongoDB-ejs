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
    // image: {
    //     type: String,
    //     required: true,
    // },
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
    }})


module.exports = mongoose.model('Product', productSchema);
