const Doctor = require('../models/Doctor');
const IcuConsultant = require('../models/IcuConsultant');
const Location = require('../models/Location');

// ===== DOCTOR CONTROLLERS =====

// Get all doctors (accessible to all authenticated users)
const getAllDoctors = async (req, res) => {
  try {
    // Return only essential public fields for dropdown usage
    const doctors = await Doctor.find({ status: 'active' })
      .select('name _id status') // Include status field
      .sort({ name: 1 }); // Sort alphabetically by name for better UX
    
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch doctors',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all doctors for admin (including inactive ones)
const getAllDoctorsAdmin = async (req, res) => {
  try {
    // Return all doctors including inactive ones for admin management
    const doctors = await Doctor.find()
      .select('name _id status createdAt updatedAt')
      .sort({ name: 1 });
    
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Error fetching all doctors:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch all doctors',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Create new doctor
const createDoctor = async (req, res) => {
  try {
    const { name, status = 'active' } = req.body;
    
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
      name: name.trim(),
      status
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
    const { name, status } = req.body;

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
      { name: name.trim(), status },
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

// Toggle doctor status (activate/deactivate)
const toggleDoctorStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Toggle status
    const newStatus = doctor.status === 'active' ? 'inactive' : 'active';
    
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedDoctor);
  } catch (error) {
    console.error('Error toggling doctor status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle doctor status',
      error: error.message
    });
  }
};

// ===== ICU CONSULTANT CONTROLLERS =====

// Get all ICU consultants (accessible to all authenticated users)
const getAllIcuConsultants = async (req, res) => {
  try {
    // Return only essential public fields for dropdown usage
    const icuConsultants = await IcuConsultant.find({ status: 'active' })
      .select('name _id status') // Include status field
      .sort({ name: 1 }); // Sort alphabetically by name for better UX
    
    res.status(200).json(icuConsultants);
  } catch (error) {
    console.error('Error fetching ICU consultants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ICU consultants',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all ICU consultants for admin (including inactive ones)
const getAllIcuConsultantsAdmin = async (req, res) => {
  try {
    // Return all ICU consultants including inactive ones for admin management
    const icuConsultants = await IcuConsultant.find()
      .select('name _id status createdAt updatedAt')
      .sort({ name: 1 });
    
    res.status(200).json(icuConsultants);
  } catch (error) {
    console.error('Error fetching all ICU consultants:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch all ICU consultants',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Create new ICU consultant
const createIcuConsultant = async (req, res) => {
  try {
    const { name, status = 'active' } = req.body;

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
      name: name.trim(),
      status
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
    const { name, status } = req.body;

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
      { name: name.trim(), status },
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

// Toggle ICU consultant status (activate/deactivate)
const toggleIcuConsultantStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const consultant = await IcuConsultant.findById(id);
    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: 'Consultant not found'
      });
    }

    // Toggle status
    const newStatus = consultant.status === 'active' ? 'inactive' : 'active';
    
    const updatedConsultant = await IcuConsultant.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedConsultant);
  } catch (error) {
    console.error('Error toggling ICU consultant status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle ICU consultant status',
      error: error.message
    });
  }
};

// ===== LOCATION CONTROLLERS =====

// Get all locations (accessible to all authenticated users)
const getAllLocations = async (req, res) => {
  try {
    // Return only essential public fields for dropdown usage
    const locations = await Location.find()
      .select('name status _id') // Return name, status and _id
      .sort({ name: 1 }); // Sort alphabetically by name for better UX
    
    res.status(200).json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch locations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Create new location
const createLocation = async (req, res) => {
  try {
    const { name, status = 'active' } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Location name is required'
      });
    }

    // Check if location already exists
    const existingLocation = await Location.findOne({ name: name.trim() });
    if (existingLocation) {
      return res.status(400).json({
        success: false,
        message: 'Location with this name already exists'
      });
    }

    const location = new Location({
      name: name.trim(),
      status
    });

    const savedLocation = await location.save();
    res.status(201).json(savedLocation);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create location',
      error: error.message
    });
  }
};

// Update location
const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Location name is required'
      });
    }

    // Check if location exists
    const existingLocation = await Location.findById(id);
    if (!existingLocation) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Check if name already exists for another location
    const duplicateLocation = await Location.findOne({ 
      name: name.trim(), 
      _id: { $ne: id } 
    });
    if (duplicateLocation) {
      return res.status(400).json({
        success: false,
        message: 'Location with this name already exists'
      });
    }

    const updatedLocation = await Location.findByIdAndUpdate(
      id,
      { name: name.trim(), status },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedLocation);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};

// Delete location
const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await Location.findByIdAndDelete(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete location',
      error: error.message
    });
  }
};

// Toggle location status (activate/deactivate)
const toggleLocationStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await Location.findById(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Toggle status
    const newStatus = location.status === 'active' ? 'inactive' : 'active';
    
    const updatedLocation = await Location.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedLocation);
  } catch (error) {
    console.error('Error toggling location status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle location status',
      error: error.message
    });
  }
};

// ===== USER MANAGEMENT CONTROLLERS =====

const User = require('../models/User');

// Get all users for admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('name doctorId role location status createdAt updatedAt')
      .sort({ createdAt: -1 });
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { name, doctorId, password, role = 'user', location, status = 'active' } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'User name is required'
      });
    }

    if (!doctorId || !doctorId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ doctorId: doctorId.trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this Employee ID already exists'
      });
    }

    const user = new User({
      name: name.trim(),
      doctorId: doctorId.trim(),
      password: password.trim(),
      role,
      location: location.trim(),
      status
    });

    const savedUser = await user.save();
    
    // Return user without password
    const userResponse = {
      _id: savedUser._id,
      name: savedUser.name,
      doctorId: savedUser.doctorId,
      role: savedUser.role,
      location: savedUser.location,
      status: savedUser.status,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt
    };

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, doctorId, role, location, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'User name is required'
      });
    }

    if (!doctorId || !doctorId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if doctorId already exists for another user
    const duplicateUser = await User.findOne({ 
      doctorId: doctorId.trim(), 
      _id: { $ne: id } 
    });
    if (duplicateUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this Employee ID already exists'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { 
        name: name.trim(), 
        doctorId: doctorId.trim(), 
        role, 
        location: location.trim(), 
        status 
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Toggle user status (activate/deactivate)
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Toggle status
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle user status',
      error: error.message
    });
  }
};

module.exports = {
  // Doctor controllers
  getAllDoctors,
  getAllDoctorsAdmin,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  toggleDoctorStatus,
  
  // ICU Consultant controllers
  getAllIcuConsultants,
  getAllIcuConsultantsAdmin,
  createIcuConsultant,
  updateIcuConsultant,
  deleteIcuConsultant,
  toggleIcuConsultantStatus,
  
  // Location controllers
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  toggleLocationStatus,

  // User management controllers
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus
}; 