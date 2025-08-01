// controllers/patientController.js
const { getPatientByUHID } = require("../auth/mssqlConnect");

exports.fetchPatientByUHID = async (req, res) => {
  const { uhid } = req.params;

  if (!uhid) {
    return res.status(400).json({ message: "UHID is required" });
  }

  const patient = await getPatientByUHID(uhid);

  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  res.status(200).json(patient);
};
