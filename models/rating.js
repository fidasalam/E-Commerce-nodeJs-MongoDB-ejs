const mongoose = require('mongoose');

// Define the rating schema
const ratingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId,
         ref: 'User', 
         required: true }, 
    product: { type: mongoose.Schema.Types.ObjectId,
         ref: 'Product',
          required: true }, 
    value: { type: Number,
         required: true,
          min: 1,
           max: 5 }, 
    createdAt: { type: Date,
         default: Date.now } 
});

// Create the Rating model
const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;
