const Doctor = require('../models/Doctor');
const IcuConsultant = require('../models/IcuConsultant');

// ===== DOCTOR CONTROLLERS =====

// Get all doctors
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch doctors',
      error: error.message 
    });
  }
};

// Create new doctor
const createDoctor = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Doctor name is required'
      });
    }

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ name: name.trim() });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'Doctor with this name already exists'
      });
    }

    const doctor = new Doctor({
      name: name.trim()
    });

    const savedDoctor = await doctor.save();
    res.status(201).json(savedDoctor);
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create doctor',
      error: error.message
    });
  }
};

// Update doctor
const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Doctor name is required'
      });
    }

    // Check if doctor exists
    const existingDoctor = await Doctor.findById(id);
    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if name already exists for another doctor
    const duplicateDoctor = await Doctor.findOne({ 
      name: name.trim(), 
      _id: { $ne: id } 
    });
    if (duplicateDoctor) {
      return res.status(400).json({
        success: false,
        message: 'Doctor with this name already exists'
      });
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedDoctor);
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor',
      error: error.message
    });
  }
};

// Delete doctor
const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findByIdAndDelete(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete doctor',
      error: error.message
    });
  }
};

// ===== ICU CONSULTANT CONTROLLERS =====

// Get all ICU consultants
const getAllIcuConsultants = async (req, res) => {
  try {
    const icuConsultants = await IcuConsultant.find().sort({ createdAt: -1 });
    res.status(200).json(icuConsultants);
  } catch (error) {
    console.error('Error fetching ICU consultants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ICU consultants',
      error: error.message
    });
  }
};

// Create new ICU consultant
const createIcuConsultant = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Consultant name is required'
      });
    }

    // Check if consultant already exists
    const existingConsultant = await IcuConsultant.findOne({ name: name.trim() });
    if (existingConsultant) {
      return res.status(400).json({
        success: false,
        message: 'Consultant with this name already exists'
      });
    }

    const icuConsultant = new IcuConsultant({
      name: name.trim()
    });

    const savedConsultant = await icuConsultant.save();
    res.status(201).json(savedConsultant);
  } catch (error) {
    console.error('Error creating ICU consultant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ICU consultant',
      error: error.message
    });
  }
};

// Update ICU consultant
const updateIcuConsultant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Consultant name is required'
      });
    }

    // Check if consultant exists
    const existingConsultant = await IcuConsultant.findById(id);
    if (!existingConsultant) {
      return res.status(404).json({
        success: false,
        message: 'Consultant not found'
      });
    }

    // Check if name already exists for another consultant
    const duplicateConsultant = await IcuConsultant.findOne({ 
      name: name.trim(), 
      _id: { $ne: id } 
    });
    if (duplicateConsultant) {
      return res.status(400).json({
        success: false,
        message: 'Consultant with this name already exists'
      });
    }

    const updatedConsultant = await IcuConsultant.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedConsultant);
  } catch (error) {
    console.error('Error updating ICU consultant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ICU consultant',
      error: error.message
    });
  }
};

// Delete ICU consultant
const deleteIcuConsultant = async (req, res) => {
  try {
    const { id } = req.params;

    const consultant = await IcuConsultant.findByIdAndDelete(id);
    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: 'Consultant not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Consultant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ICU consultant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ICU consultant',
      error: error.message
    });
  }
};

module.exports = {
  // Doctor controllers
  getAllDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  
  // ICU Consultant controllers
  getAllIcuConsultants,
  createIcuConsultant,
  updateIcuConsultant,
  deleteIcuConsultant
}; 