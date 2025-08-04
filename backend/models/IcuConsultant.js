const mongoose = require('mongoose');

const icuConsultantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide consultant name'],
    trim: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updatedAt field before saving
icuConsultantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const IcuConsultant = mongoose.model('IcuConsultant', icuConsultantSchema);

module.exports = IcuConsultant; 