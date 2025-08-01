// routes/patientRoutes.js
const express = require("express");
const router = express.Router();
const { fetchPatientByUHID } = require("../controllers/bbpatientController");

// Route: GET /api/patient/:uhid
router.get("/patient/:uhid", fetchPatientByUHID);

module.exports = router;
