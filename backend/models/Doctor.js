const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide doctor name'],
    trim: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
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
doctorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor; 