const mongoose = require('mongoose');

const FcmTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('FcmToken', FcmTokenSchema);