const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['A', 'S'], default: 'A' }
});

module.exports = mongoose.model('Image', imageSchema);
