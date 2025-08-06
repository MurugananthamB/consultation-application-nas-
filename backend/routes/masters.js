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

// GET /api/masters/doctors - Get all doctors (accessible to all authenticated users)
router.get('/doctors', masterController.getAllDoctors);

// GET /api/masters/doctors/admin - Get all doctors for admin (including inactive ones)
router.get('/doctors/admin', verifyAdmin, masterController.getAllDoctorsAdmin);

// POST /api/masters/doctors - Create new doctor (admin only)
router.post('/doctors', verifyAdmin, masterController.createDoctor);

// PUT /api/masters/doctors/:id - Update doctor (admin only)
router.put('/doctors/:id', verifyAdmin, masterController.updateDoctor);

// DELETE /api/masters/doctors/:id - Delete doctor (admin only)
router.delete('/doctors/:id', verifyAdmin, masterController.deleteDoctor);

// PATCH /api/masters/doctors/:id/toggle-status - Toggle doctor status (admin only)
router.patch('/doctors/:id/toggle-status', verifyAdmin, masterController.toggleDoctorStatus);

// ===== ICU CONSULTANT ROUTES =====

// GET /api/masters/icu-consultants - Get all ICU consultants (accessible to all authenticated users)
router.get('/icu-consultants', masterController.getAllIcuConsultants);

// GET /api/masters/icu-consultants/admin - Get all ICU consultants for admin (including inactive ones)
router.get('/icu-consultants/admin', verifyAdmin, masterController.getAllIcuConsultantsAdmin);

// POST /api/masters/icu-consultants - Create new ICU consultant (admin only)
router.post('/icu-consultants', verifyAdmin, masterController.createIcuConsultant);

// PUT /api/masters/icu-consultants/:id - Update ICU consultant (admin only)
router.put('/icu-consultants/:id', verifyAdmin, masterController.updateIcuConsultant);

// DELETE /api/masters/icu-consultants/:id - Delete ICU consultant (admin only)
router.delete('/icu-consultants/:id', verifyAdmin, masterController.deleteIcuConsultant);

// PATCH /api/masters/icu-consultants/:id/toggle-status - Toggle ICU consultant status (admin only)
router.patch('/icu-consultants/:id/toggle-status', verifyAdmin, masterController.toggleIcuConsultantStatus);

// ===== LOCATION ROUTES =====

// GET /api/masters/locations - Get all locations (accessible to all authenticated users)
router.get('/locations', masterController.getAllLocations);

// POST /api/masters/locations - Create new location (admin only)
router.post('/locations', verifyAdmin, masterController.createLocation);

// PUT /api/masters/locations/:id - Update location (admin only)
router.put('/locations/:id', verifyAdmin, masterController.updateLocation);

// DELETE /api/masters/locations/:id - Delete location (admin only)
router.delete('/locations/:id', verifyAdmin, masterController.deleteLocation);

// PATCH /api/masters/locations/:id/toggle-status - Toggle location status (admin only)
router.patch('/locations/:id/toggle-status', verifyAdmin, masterController.toggleLocationStatus);

// ===== USER MANAGEMENT ROUTES =====

// GET /api/masters/users - Get all users (admin only)
router.get('/users', verifyAdmin, masterController.getAllUsers);

// POST /api/masters/users - Create new user (admin only)
router.post('/users', verifyAdmin, masterController.createUser);

// PUT /api/masters/users/:id - Update user (admin only)
router.put('/users/:id', verifyAdmin, masterController.updateUser);

// DELETE /api/masters/users/:id - Delete user (admin only)
router.delete('/users/:id', verifyAdmin, masterController.deleteUser);

// PATCH /api/masters/users/:id/toggle-status - Toggle user status (admin only)
router.patch('/users/:id/toggle-status', verifyAdmin, masterController.toggleUserStatus);

module.exports = router; 