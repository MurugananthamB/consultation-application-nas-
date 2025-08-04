const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
};

// ===== DOCTOR ROUTES =====

// GET /api/masters/doctors - Get all doctors
router.get('/doctors', verifyAdmin, masterController.getAllDoctors);

// POST /api/masters/doctors - Create new doctor
router.post('/doctors', verifyAdmin, masterController.createDoctor);

// PUT /api/masters/doctors/:id - Update doctor
router.put('/doctors/:id', verifyAdmin, masterController.updateDoctor);

// DELETE /api/masters/doctors/:id - Delete doctor
router.delete('/doctors/:id', verifyAdmin, masterController.deleteDoctor);

// ===== ICU CONSULTANT ROUTES =====

// GET /api/masters/icu-consultants - Get all ICU consultants
router.get('/icu-consultants', verifyAdmin, masterController.getAllIcuConsultants);

// POST /api/masters/icu-consultants - Create new ICU consultant
router.post('/icu-consultants', verifyAdmin, masterController.createIcuConsultant);

// PUT /api/masters/icu-consultants/:id - Update ICU consultant
router.put('/icu-consultants/:id', verifyAdmin, masterController.updateIcuConsultant);

// DELETE /api/masters/icu-consultants/:id - Delete ICU consultant
router.delete('/icu-consultants/:id', verifyAdmin, masterController.deleteIcuConsultant);

module.exports = router; 