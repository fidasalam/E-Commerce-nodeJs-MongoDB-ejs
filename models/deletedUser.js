const mongoose = require('mongoose');

const deletedUserSchema = new mongoose.Schema({
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', // Reference to the User model (or whatever your original user model is named)
    },
    deletedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    // Add other properties if needed
});

const DeletedUser = mongoose.model('DeletedUser', deletedUserSchema);

module.exports = DeletedUser;
