const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');

const consultationSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
    },
    uhidId: {
      type: String,
      required: [true, "UHID ID is required"],
      trim: true,
      // REMOVE unique: true
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    doctor: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Doctor ID is required"],
    },
    doctorName: {
      type: String,
      trim: true,
    },
    attenderName: {
      type: String,
      trim: true,
    },
    icuConsultantName: {
      type: String,
      trim: true,
    },
    conditionType: {
      type: String,
      required: [true, "Condition Type is required"],
      enum: ["normal", "CriticalCare", "MLC"],
      trim: true,
      default: "normal"
    },
    location: {
      type: String,
      trim: true,
    },
    videoFileName: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    recordingDuration: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["completed", "pending", "cancelled"],
      default: "completed",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create indexes for faster queries
consultationSchema.index({ uhidId: 1 });
consultationSchema.index({ doctor: 1 });
consultationSchema.index({ date: -1 });

module.exports = mongoose.model('Consultation', consultationSchema);