
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    msg: String,
    email: String,
  });
  const message = mongoose.model('message', messageSchema);
  
  module.exports = message;
  