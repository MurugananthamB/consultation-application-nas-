const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Consultation = require('../models/Consultation');
const { protect, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Load dynamic storage path using environment variables
const getVideoUploadPath = () => {
  // Use environment variables for Windows NAS configuration
  const nasMountPath = process.env.NAS_MOUNT_PATH || "Z:";
  const nasFolder = process.env.NAS_FOLDER || "Video Record";
  
  // Construct the full NAS path
  const fullNasPath = path.join(nasMountPath, nasFolder);
  
  console.log('📁 NAS Mount Path (ENV):', nasMountPath);
  console.log('📁 NAS Folder (ENV):', nasFolder);
  console.log('📁 Full NAS Path resolved:', fullNasPath);
  
  return fullNasPath;
};

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = getVideoUploadPath();
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('video/') ? cb(null, true) : cb(new Error('Not a video file!'), false);
  }
});

// Upload a video using consultationId and date
router.post('/upload', upload.single('video'), async (req, res) => {
  const { consultationId, date } = req.body;

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No video file uploaded" });
  }

  if (!consultationId || !consultationId.match(/^[0-9a-fA-F]{24}$/)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or missing consultationId" });
  }

  const fileExt = ".webm"; // Always save with .webm extension
  const targetDate = date || new Date().toISOString().slice(0, 10); // fallback if not passed
  const filename = `${consultationId}${fileExt}`;

  try {
    const baseNASPath = getVideoUploadPath();
    const fullFolderPath = path.join(baseNASPath, targetDate);
    
    console.log('📁 Base NAS Path:', baseNASPath);
    console.log('📁 Target Date Folder:', targetDate);
    console.log('📁 Full Folder Path:', fullFolderPath);

    // Create the target folder if it doesn't exist
    if (!fs.existsSync(fullFolderPath)) {
      console.log('📁 Creating NAS folder:', fullFolderPath);
      fs.mkdirSync(fullFolderPath, { recursive: true });
    } else {
      console.log('📁 NAS folder already exists:', fullFolderPath);
    }

    const finalFilePath = path.join(fullFolderPath, filename);
    console.log('📁 Final file path:', finalFilePath);

    // Move the uploaded temp file to final NAS path
    fs.renameSync(req.file.path, finalFilePath);
    console.log('✅ Video successfully moved to NAS:', finalFilePath);

    // Verify file exists in NAS
    if (fs.existsSync(finalFilePath)) {
      const stats = fs.statSync(finalFilePath);
      console.log('✅ File verified in NAS - Size:', stats.size, 'bytes');
    } else {
      console.error('❌ File not found in NAS after move:', finalFilePath);
    }

    // Optional: update consultation status
    await Consultation.findByIdAndUpdate(consultationId, {
      videoUploaded: true,
      updatedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      filePath: finalFilePath,
      fileName: filename,
      message: "Video uploaded successfully to NAS",
      nasPath: finalFilePath
    });
  } catch (error) {
    console.error("❌ Error saving video to NAS:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Video upload failed",
        error: error.message,
      });
  }
});


// Create consultation
router.post(
  "/",
  [
    protect,
    authorize("doctor", "admin"),
    body("patientName").notEmpty().withMessage("Patient name is required"),
    body("uhidId").notEmpty().withMessage("UHID is required"),
    body("department").notEmpty().withMessage("Department is required"),
    body("conditionType").isIn(["normal", "CriticalCare", "MLC"]).withMessage("Condition Type must be normal, CriticalCare, or MLC"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      console.log("🚀 Consultation request body:", req.body);
      console.log("📍 Location from request:", req.body.location);
      console.log("🔐 Authenticated user:", req.user);

      const consultationData = {
        ...req.body,
        doctor: req.user.id,
      };

      console.log("💾 Final consultation data before saving:", consultationData);
      const consultation = await Consultation.create(consultationData);
      console.log("✅ Consultation created with location:", consultation.location);
      res.status(201).json(consultation);
    } catch (error) {
      console.error("❌ Error creating consultation:", error);
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ success: false, message: "UHID already exists" });
      }
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);


// Get all consultations
router.get('/', protect, async (req, res) => {
  try {
    const {
      dateFrom, dateTo, patientName, doctorName,
      uhidId, page = 1, limit = 10,
      sortField = 'date', sortDirection = 'desc'
    } = req.query;

    const query = {};

    if (dateFrom && dateTo) {
      query.date = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      };
    }

    if (patientName) query.patientName = { $regex: patientName, $options: 'i' };
    if (doctorName) query.doctorName = { $regex: doctorName, $options: 'i' };
    if (uhidId) query.uhidId = { $regex: uhidId, $options: 'i' };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Consultation.countDocuments(query);
    const consultations = await Consultation.find(query)
      .sort({ [sortField]: sortDirection === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: {
        consultations,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Doctor-specific consultations
router.get('/doctor', authorize('doctor', 'admin'), async (req, res) => {
  try {
    const consultations = await Consultation.find({ doctor: req.user.id }).sort({ date: -1 });
    res.json({ success: true, count: consultations.length, data: consultations });
  } catch (error) {
    console.error('Error fetching doctor consultations:', error);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// Get consultation by UHID
router.get('/uhid/:uhidId', async (req, res) => {
  try {
    const consultation = await Consultation.findOne({ uhidId: req.params.uhidId }).sort({ date: -1 });
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found' });
    res.json({ success: true, data: consultation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Example Express route
router.get('/uhId/:uhId', protect, async (req, res) => {
  const consultation = await Consultation.findOne({ uhId: req.params.uhId }).sort({ date: -1 });
  if (!consultation) return res.status(404).json({ message: 'Not found' });
  res.json(consultation);
});

// Update consultation — anyone logged-in can update any field
router.put('/:id', protect, async (req, res) => {
  try {
    // 1) ID validate
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    // 2) Consultation exists?
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    // 3) Direct update with all fields from req.body
    const updated = await Consultation.findByIdAndUpdate(
      req.params.id,
      { $set: req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating consultation:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});



// Delete consultation
router.delete('/:id', authorize('doctor', 'admin'), async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found' });

    if (consultation.doctor.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    await consultation.remove();
    res.json({ success: true, message: 'Consultation removed' });
  } catch (error) {
    console.error('Error deleting consultation:', error);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

module.exports = router;
