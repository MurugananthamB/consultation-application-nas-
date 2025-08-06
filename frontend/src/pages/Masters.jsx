import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, ListGroup, Alert } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUserMd, FaUserNurse, FaSave, FaTimes, FaEdit, FaTrash, FaSpinner, FaMapMarkerAlt, FaToggleOn, FaToggleOff, FaUsers } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../services/api';

const Masters = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for current view
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'doctors', 'icu', 'locations', 'users'
  
  // State for doctors management
  const [doctors, setDoctors] = useState([]);
  const [doctorForm, setDoctorForm] = useState({ name: '', status: 'active' });
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorError, setDoctorError] = useState('');
  
  // State for ICU consultants management
  const [icuConsultants, setIcuConsultants] = useState([]);
  const [icuForm, setIcuForm] = useState({ name: '', status: 'active' });
  const [editingIcu, setEditingIcu] = useState(null);
  const [icuLoading, setIcuLoading] = useState(false);
  const [icuError, setIcuError] = useState('');
  
  // State for locations management
  const [locations, setLocations] = useState([]);
  const [locationForm, setLocationForm] = useState({ name: '', status: 'active' });
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  // State for users management
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({ 
    name: '', 
    doctorId: '', 
    password: '', 
    role: 'user', 
    location: '', 
    status: 'active' 
  });
  const [editingUser, setEditingUser] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');

  // Redirect if not admin
  React.useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/home');
    }
  }, [user, navigate]);

  // API Functions
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch doctors
  const fetchDoctors = async () => {
    setDoctorLoading(true);
    setDoctorError('');
    try {
      const response = await fetch(`${API_URL}/masters/doctors/admin`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      } else {
        setDoctorError('Failed to fetch doctors');
      }
    } catch (error) {
      setDoctorError('Error fetching doctors');
    } finally {
      setDoctorLoading(false);
    }
  };

  // Fetch ICU consultants
  const fetchIcuConsultants = async () => {
    setIcuLoading(true);
    setIcuError('');
    try {
      const response = await fetch(`${API_URL}/masters/icu-consultants/admin`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setIcuConsultants(data);
      } else {
        setIcuError('Failed to fetch ICU consultants');
      }
    } catch (error) {
      setIcuError('Error fetching ICU consultants');
    } finally {
      setIcuLoading(false);
    }
  };

  // Fetch locations
  const fetchLocations = async () => {
    setLocationLoading(true);
    setLocationError('');
    try {
      const response = await fetch(`${API_URL}/masters/locations`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      } else {
        setLocationError('Failed to fetch locations');
      }
    } catch (error) {
      setLocationError('Error fetching locations');
    } finally {
      setLocationLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    setUserLoading(true);
    setUserError('');
    try {
      const response = await fetch(`${API_URL}/masters/users`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setUserError('Failed to fetch users');
      }
    } catch (error) {
      setUserError('Error fetching users');
    } finally {
      setUserLoading(false);
    }
  };

  // Load data when view changes
  useEffect(() => {
    if (currentView === 'doctors') {
      fetchDoctors();
    } else if (currentView === 'icu') {
      fetchIcuConsultants();
    } else if (currentView === 'locations') {
      fetchLocations();
    } else if (currentView === 'users') {
      fetchUsers();
    }
  }, [currentView]);

  // Doctor management functions
  const handleDoctorFormChange = (e) => {
    setDoctorForm({
      ...doctorForm,
      [e.target.name]: e.target.value
    });
  };

  const handleDoctorSave = async () => {
    if (!doctorForm.name.trim()) return;
    
    setDoctorLoading(true);
    setDoctorError('');
    
    try {
      const url = editingDoctor 
        ? `${API_URL}/masters/doctors/${editingDoctor._id}`
        : `${API_URL}/masters/doctors`;
      
      const method = editingDoctor ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(doctorForm)
      });
      
      if (response.ok) {
        const savedDoctor = await response.json();
        
        if (editingDoctor) {
          // Update existing doctor
          setDoctors(doctors.map(doc => 
            doc._id === editingDoctor._id ? savedDoctor : doc
          ));
        } else {
          // Add new doctor
          setDoctors([...doctors, savedDoctor]);
        }
        
        setDoctorForm({ name: '' });
        setEditingDoctor(null);
      } else {
        const errorData = await response.json();
        setDoctorError(errorData.message || 'Failed to save doctor');
      }
    } catch (error) {
      setDoctorError('Error saving doctor');
    } finally {
      setDoctorLoading(false);
    }
  };

  const handleDoctorClear = () => {
    setDoctorForm({ name: '', status: 'active' });
    setEditingDoctor(null);
  };

  const handleDoctorEdit = (doctor) => {
    setDoctorForm({ name: doctor.name, status: doctor.status });
    setEditingDoctor(doctor);
  };

  const handleDoctorDelete = async (doctorId) => {
    setDoctorLoading(true);
    setDoctorError('');
    
    try {
      const response = await fetch(`${API_URL}/masters/doctors/${doctorId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        setDoctors(doctors.filter(doc => doc._id !== doctorId));
        if (editingDoctor?._id === doctorId) {
          setEditingDoctor(null);
          setDoctorForm({ name: '', status: 'active' });
        }
      } else {
        const errorData = await response.json();
        setDoctorError(errorData.message || 'Failed to delete doctor');
      }
    } catch (error) {
      setDoctorError('Error deleting doctor');
    } finally {
      setDoctorLoading(false);
    }
  };

  const handleDoctorToggleStatus = async (doctorId) => {
    setDoctorLoading(true);
    setDoctorError('');
    
    try {
      const response = await fetch(`${API_URL}/masters/doctors/${doctorId}/toggle-status`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const updatedDoctor = await response.json();
        setDoctors(doctors.map(doc => 
          doc._id === doctorId ? updatedDoctor : doc
        ));
        
        // Update editing form if this doctor is being edited
        if (editingDoctor?._id === doctorId) {
          setDoctorForm({ 
            name: updatedDoctor.name, 
            status: updatedDoctor.status 
          });
        }
      } else {
        const errorData = await response.json();
        setDoctorError(errorData.message || 'Failed to toggle doctor status');
      }
    } catch (error) {
      setDoctorError('Error toggling doctor status');
    } finally {
      setDoctorLoading(false);
    }
  };

  // ICU Consultant management functions
  const handleIcuFormChange = (e) => {
    setIcuForm({
      ...icuForm,
      [e.target.name]: e.target.value
    });
  };

  const handleIcuSave = async () => {
    if (!icuForm.name.trim()) return;
    
    setIcuLoading(true);
    setIcuError('');
    
    try {
      const url = editingIcu 
        ? `${API_URL}/masters/icu-consultants/${editingIcu._id}`
        : `${API_URL}/masters/icu-consultants`;
      
      const method = editingIcu ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(icuForm)
      });
      
      if (response.ok) {
        const savedIcu = await response.json();
        
        if (editingIcu) {
          // Update existing ICU consultant
          setIcuConsultants(icuConsultants.map(icu => 
            icu._id === editingIcu._id ? savedIcu : icu
          ));
        } else {
          // Add new ICU consultant
          setIcuConsultants([...icuConsultants, savedIcu]);
        }
        
        setIcuForm({ name: '' });
        setEditingIcu(null);
      } else {
        const errorData = await response.json();
        setIcuError(errorData.message || 'Failed to save ICU consultant');
      }
    } catch (error) {
      setIcuError('Error saving ICU consultant');
    } finally {
      setIcuLoading(false);
    }
  };

  const handleIcuClear = () => {
    setIcuForm({ name: '', status: 'active' });
    setEditingIcu(null);
  };

  const handleIcuEdit = (icu) => {
    setIcuForm({ name: icu.name, status: icu.status });
    setEditingIcu(icu);
  };

  const handleIcuDelete = async (icuId) => {
    setIcuLoading(true);
    setIcuError('');
    
    try {
      const response = await fetch(`${API_URL}/masters/icu-consultants/${icuId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        setIcuConsultants(icuConsultants.filter(icu => icu._id !== icuId));
        if (editingIcu?._id === icuId) {
          setEditingIcu(null);
          setIcuForm({ name: '' });
        }
      } else {
        const errorData = await response.json();
        setIcuError(errorData.message || 'Failed to delete ICU consultant');
      }
    } catch (error) {
      setIcuError('Error deleting ICU consultant');
    } finally {
      setIcuLoading(false);
    }
  };

  const handleIcuToggleStatus = async (icuId) => {
    setIcuLoading(true);
    setIcuError('');
    
    try {
      const response = await fetch(`${API_URL}/masters/icu-consultants/${icuId}/toggle-status`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const updatedIcu = await response.json();
        setIcuConsultants(icuConsultants.map(icu => 
          icu._id === icuId ? updatedIcu : icu
        ));
        
        // Update editing form if this ICU consultant is being edited
        if (editingIcu?._id === icuId) {
          setIcuForm({ 
            name: updatedIcu.name, 
            status: updatedIcu.status 
          });
        }
      } else {
        const errorData = await response.json();
        setIcuError(errorData.message || 'Failed to toggle ICU consultant status');
      }
    } catch (error) {
      setIcuError('Error toggling ICU consultant status');
    } finally {
      setIcuLoading(false);
    }
  };

  // Location management functions
  const handleLocationFormChange = (e) => {
    setLocationForm({
      ...locationForm,
      [e.target.name]: e.target.value
    });
  };

  const handleLocationSave = async () => {
    if (!locationForm.name.trim()) return;
    
    setLocationLoading(true);
    setLocationError('');
    
    try {
      const url = editingLocation 
        ? `${API_URL}/masters/locations/${editingLocation._id}`
        : `${API_URL}/masters/locations`;
      
      const method = editingLocation ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(locationForm)
      });
      
      if (response.ok) {
        const savedLocation = await response.json();
        
        if (editingLocation) {
          // Update existing location
          setLocations(locations.map(loc => 
            loc._id === editingLocation._id ? savedLocation : loc
          ));
        } else {
          // Add new location
          setLocations([...locations, savedLocation]);
        }
        
        setLocationForm({ name: '', status: 'active' });
        setEditingLocation(null);
      } else {
        const errorData = await response.json();
        setLocationError(errorData.message || 'Failed to save location');
      }
    } catch (error) {
      setLocationError('Error saving location');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationClear = () => {
    setLocationForm({ name: '', status: 'active' });
    setEditingLocation(null);
  };

  const handleLocationEdit = (location) => {
    setLocationForm({ name: location.name, status: location.status });
    setEditingLocation(location);
  };

  const handleLocationDelete = async (locationId) => {
    setLocationLoading(true);
    setLocationError('');
    
    try {
      const response = await fetch(`${API_URL}/masters/locations/${locationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        setLocations(locations.filter(loc => loc._id !== locationId));
        if (editingLocation?._id === locationId) {
          setEditingLocation(null);
          setLocationForm({ name: '', status: 'active' });
        }
      } else {
        const errorData = await response.json();
        setLocationError(errorData.message || 'Failed to delete location');
      }
    } catch (error) {
      setLocationError('Error deleting location');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationToggleStatus = async (locationId) => {
    setLocationLoading(true);
    setLocationError('');
    
    try {
      const response = await fetch(`${API_URL}/masters/locations/${locationId}/toggle-status`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const updatedLocation = await response.json();
        setLocations(locations.map(loc => 
          loc._id === locationId ? updatedLocation : loc
        ));
        
        // Update editing form if this location is being edited
        if (editingLocation?._id === locationId) {
          setLocationForm({ 
            name: updatedLocation.name, 
            status: updatedLocation.status 
          });
        }
      } else {
        const errorData = await response.json();
        setLocationError(errorData.message || 'Failed to toggle location status');
      }
    } catch (error) {
      setLocationError('Error toggling location status');
    } finally {
      setLocationLoading(false);
    }
  };

  // User management functions
  const handleUserFormChange = (e) => {
    setUserForm({
      ...userForm,
      [e.target.name]: e.target.value
    });
  };

  const handleUserSave = async () => {
    if (!userForm.name.trim() || !userForm.doctorId.trim() || !userForm.password.trim() || !userForm.location.trim()) return;
    
    setUserLoading(true);
    setUserError('');
    
    try {
      const url = editingUser 
        ? `${API_URL}/masters/users/${editingUser._id}`
        : `${API_URL}/masters/users`;
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(userForm)
      });
      
      if (response.ok) {
        const savedUser = await response.json();
        
        if (editingUser) {
          // Update existing user
          setUsers(users.map(usr => 
            usr._id === editingUser._id ? savedUser : usr
          ));
        } else {
          // Add new user
          setUsers([...users, savedUser]);
        }
        
        setUserForm({ 
          name: '', 
          doctorId: '', 
          password: '', 
          role: 'user', 
          location: '', 
          status: 'active' 
        });
        setEditingUser(null);
      } else {
        const errorData = await response.json();
        setUserError(errorData.message || 'Failed to save user');
      }
    } catch (error) {
      setUserError('Error saving user');
    } finally {
      setUserLoading(false);
    }
  };

  const handleUserClear = () => {
    setUserForm({ 
      name: '', 
      doctorId: '', 
      password: '', 
      role: 'user', 
      location: '', 
      status: 'active' 
    });
    setEditingUser(null);
  };

  const handleUserEdit = (user) => {
    setUserForm({ 
      name: user.name, 
      doctorId: user.doctorId, 
      password: '', 
      role: user.role, 
      location: user.location, 
      status: user.status 
    });
    setEditingUser(user);
  };

  const handleUserDelete = async (userId) => {
    setUserLoading(true);
    setUserError('');
    
    try {
      const response = await fetch(`${API_URL}/masters/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        setUsers(users.filter(usr => usr._id !== userId));
      } else {
        const errorData = await response.json();
        setUserError(errorData.message || 'Failed to delete user');
      }
    } catch (error) {
      setUserError('Error deleting user');
    } finally {
      setUserLoading(false);
    }
  };

  const handleUserToggleStatus = async (userId) => {
    setUserLoading(true);
    setUserError('');
    
    try {
      const response = await fetch(`${API_URL}/masters/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(usr => 
          usr._id === userId ? updatedUser : usr
        ));
        
        // Update editing form if this user is being edited
        if (editingUser?._id === userId) {
          setUserForm({ 
            name: updatedUser.name, 
            doctorId: updatedUser.doctorId, 
            password: '', 
            role: updatedUser.role, 
            location: updatedUser.location, 
            status: updatedUser.status 
          });
        }
      } else {
        const errorData = await response.json();
        setUserError(errorData.message || 'Failed to toggle user status');
      }
    } catch (error) {
      setUserError('Error toggling user status');
    } finally {
      setUserLoading(false);
    }
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
    setDoctorForm({ name: '', status: 'active' });
    setIcuForm({ name: '', status: 'active' });
    setLocationForm({ name: '', status: 'active' });
    setUserForm({ 
      name: '', 
      doctorId: '', 
      password: '', 
      role: 'user', 
      location: '', 
      status: 'active' 
    });
    setEditingDoctor(null);
    setEditingIcu(null);
    setEditingLocation(null);
    setEditingUser(null);
  };



  const handleDoctorsClick = () => {
    setCurrentView('doctors');
  };

  const handleIcuConsultantClick = () => {
    setCurrentView('icu');
  };

  const handleLocationsClick = () => {
    setCurrentView('locations');
  };

  const handleUsersClick = () => {
    setCurrentView('users');
  };

  // Render Doctor Management Section
  const renderDoctorSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-4"
    >
      <Card
        className="shadow-lg border-0"
        style={{
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <Card.Body className="p-4">
          <h4 className="mb-4 fw-bold text-dark">Doctor Master</h4>
          
          <Row className="g-4">
            {/* Left Section - Form */}
            <Col md={6}>
              <Card
                className="shadow-sm border-0 h-100"
                style={{
                  borderRadius: "12px",
                  background: "rgba(248, 250, 252, 0.8)",
                  border: "1px solid rgba(226, 232, 240, 0.8)",
                }}
              >
                                 <Card.Body className="p-4">
                   <h5 className="mb-3 fw-bold text-dark">Add New Doctor</h5>
                   
                   {doctorError && (
                     <Alert variant="danger" className="mb-3">
                       {doctorError}
                     </Alert>
                   )}
                   
                   <Form>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Doctor Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={doctorForm.name}
                        onChange={handleDoctorFormChange}
                        placeholder="Enter doctor name"
                        style={{
                          borderRadius: "8px",
                          border: "2px solid #e2e8f0",
                          fontSize: "0.9rem",
                          padding: "8px 12px",
                        }}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Status</Form.Label>
                      <Form.Select
                        name="status"
                        value={doctorForm.status}
                        onChange={handleDoctorFormChange}
                        style={{
                          borderRadius: "8px",
                          border: "2px solid #e2e8f0",
                          fontSize: "0.9rem",
                          padding: "8px 12px",
                        }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </Form.Group>
                    
                    <div className="d-flex gap-2 mt-4">
                                             <Button
                         variant="primary"
                         onClick={handleDoctorSave}
                         disabled={doctorLoading}
                         className="flex-fill d-flex align-items-center justify-content-center"
                         style={{
                           background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                           border: "none",
                           borderRadius: "8px",
                           padding: "10px 20px",
                           fontSize: "0.9rem",
                           fontWeight: "500",
                         }}
                       >
                         {doctorLoading ? (
                           <FaSpinner className="me-2 fa-spin" />
                         ) : (
                           <FaSave className="me-2" />
                         )}
                         {editingDoctor ? 'Update' : 'Save'}
                       </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={handleDoctorClear}
                        className="flex-fill d-flex align-items-center justify-content-center"
                        style={{
                          borderRadius: "8px",
                          padding: "10px 20px",
                          fontSize: "0.9rem",
                          fontWeight: "500",
                        }}
                      >
                        <FaTimes className="me-2" />
                        Clear
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Right Section - List */}
            <Col md={12}>
              <Card
                className="shadow-sm border-0 h-100"
                style={{
                  borderRadius: "12px",
                  background: "rgba(248, 250, 252, 0.8)",
                  border: "1px solid rgba(226, 232, 240, 0.8)",
                }}
              >
                <Card.Body className="p-4">
                  <h5 className="mb-3 fw-bold text-dark">Existing Doctors</h5>
                  
                                     <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                     {doctorLoading ? (
                       <div className="text-center py-4">
                         <FaSpinner className="fa-spin me-2" />
                         <span>Loading doctors...</span>
                       </div>
                     ) : doctors.length === 0 ? (
                       <div className="text-center text-muted py-4">
                         <p>No doctors found</p>
                       </div>
                     ) : (
                      <ListGroup variant="flush">
                        {doctors.map((doctor) => (
                          <ListGroup.Item
                            key={doctor._id}
                            className="border-0 mb-2 p-3"
                            style={{
                              background: "rgba(255, 255, 255, 0.8)",
                              borderRadius: "8px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                            onClick={() => handleDoctorEdit(doctor)}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="flex-grow-1">
                                <h6 className="mb-1 fw-bold text-dark">{doctor.name}</h6>
                                <small className={`badge ${doctor.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                  {doctor.status}
                                </small>
                              </div>
                              <div className="d-flex gap-2">
                                <Button
                                  variant={doctor.status === 'active' ? 'outline-warning' : 'outline-success'}
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDoctorToggleStatus(doctor._id);
                                  }}
                                  style={{ borderRadius: "6px", padding: "4px 8px" }}
                                  title={`${doctor.status === 'active' ? 'Deactivate' : 'Activate'} doctor`}
                                >
                                  {doctor.status === 'active' ? <FaToggleOn size={12} /> : <FaToggleOff size={12} />}
                                </Button>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDoctorEdit(doctor);
                                  }}
                                  style={{ borderRadius: "6px", padding: "4px 8px" }}
                                >
                                  <FaEdit size={12} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDoctorDelete(doctor._id);
                                  }}
                                  style={{ borderRadius: "6px", padding: "4px 8px" }}
                                >
                                  <FaTrash size={12} />
                                </Button>
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </motion.div>
  );

  // Render ICU Consultant Management Section
  const renderIcuSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-4"
    >
      <Card
        className="shadow-lg border-0"
        style={{
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <Card.Body className="p-4">
          <h4 className="mb-4 fw-bold text-dark">ICU Consultant Master</h4>
          
          <Row className="g-4">
            {/* Left Section - Form */}
            <Col md={6}>
              <Card
                className="shadow-sm border-0 h-100"
                style={{
                  borderRadius: "12px",
                  background: "rgba(248, 250, 252, 0.8)",
                  border: "1px solid rgba(226, 232, 240, 0.8)",
                }}
              >
                                 <Card.Body className="p-4">
                   <h5 className="mb-3 fw-bold text-dark">Add New ICU Consultant</h5>
                   
                   {icuError && (
                     <Alert variant="danger" className="mb-3">
                       {icuError}
                     </Alert>
                   )}
                   
                   <Form>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Consultant Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={icuForm.name}
                        onChange={handleIcuFormChange}
                        placeholder="Enter consultant name"
                        style={{
                          borderRadius: "8px",
                          border: "2px solid #e2e8f0",
                          fontSize: "0.9rem",
                          padding: "8px 12px",
                        }}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Status</Form.Label>
                      <Form.Select
                        name="status"
                        value={icuForm.status}
                        onChange={handleIcuFormChange}
                        style={{
                          borderRadius: "8px",
                          border: "2px solid #e2e8f0",
                          fontSize: "0.9rem",
                          padding: "8px 12px",
                        }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </Form.Group>
                    
                    <div className="d-flex gap-2 mt-4">
                                             <Button
                         variant="primary"
                         onClick={handleIcuSave}
                         disabled={icuLoading}
                         className="flex-fill d-flex align-items-center justify-content-center"
                         style={{
                           background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                           border: "none",
                           borderRadius: "8px",
                           padding: "10px 20px",
                           fontSize: "0.9rem",
                           fontWeight: "500",
                         }}
                       >
                         {icuLoading ? (
                           <FaSpinner className="me-2 fa-spin" />
                         ) : (
                           <FaSave className="me-2" />
                         )}
                         {editingIcu ? 'Update' : 'Save'}
                       </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={handleIcuClear}
                        className="flex-fill d-flex align-items-center justify-content-center"
                        style={{
                          borderRadius: "8px",
                          padding: "10px 20px",
                          fontSize: "0.9rem",
                          fontWeight: "500",
                        }}
                      >
                        <FaTimes className="me-2" />
                        Clear
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Right Section - List */}
            <Col md={12}>
              <Card
                className="shadow-sm border-0 h-100"
                style={{
                  borderRadius: "12px",
                  background: "rgba(248, 250, 252, 0.8)",
                  border: "1px solid rgba(226, 232, 240, 0.8)",
                }}
              >
                <Card.Body className="p-4">
                  <h5 className="mb-3 fw-bold text-dark">Existing ICU Consultants</h5>
                  
                                     <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                     {icuLoading ? (
                       <div className="text-center py-4">
                         <FaSpinner className="fa-spin me-2" />
                         <span>Loading ICU consultants...</span>
                       </div>
                     ) : icuConsultants.length === 0 ? (
                       <div className="text-center text-muted py-4">
                         <p>No ICU consultants found</p>
                       </div>
                     ) : (
                      <ListGroup variant="flush">
                        {icuConsultants.map((icu) => (
                          <ListGroup.Item
                            key={icu._id}
                            className="border-0 mb-2 p-3"
                            style={{
                              background: "rgba(255, 255, 255, 0.8)",
                              borderRadius: "8px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                            onClick={() => handleIcuEdit(icu)}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="flex-grow-1">
                                <h6 className="mb-1 fw-bold text-dark">{icu.name}</h6>
                                <small className={`badge ${icu.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                  {icu.status}
                                </small>
                              </div>
                              <div className="d-flex gap-2">
                                <Button
                                  variant={icu.status === 'active' ? 'outline-warning' : 'outline-success'}
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleIcuToggleStatus(icu._id);
                                  }}
                                  style={{ borderRadius: "6px", padding: "4px 8px" }}
                                  title={`${icu.status === 'active' ? 'Deactivate' : 'Activate'} ICU consultant`}
                                >
                                  {icu.status === 'active' ? <FaToggleOn size={12} /> : <FaToggleOff size={12} />}
                                </Button>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleIcuEdit(icu);
                                  }}
                                  style={{ borderRadius: "6px", padding: "4px 8px" }}
                                >
                                  <FaEdit size={12} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleIcuDelete(icu._id);
                                  }}
                                  style={{ borderRadius: "6px", padding: "4px 8px" }}
                                >
                                  <FaTrash size={12} />
                                </Button>
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </motion.div>
  );

  // Render Location Management Section
  const renderLocationSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-4"
    >
      <Card
        className="shadow-lg border-0"
        style={{
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <Card.Body className="p-4">
          <h4 className="mb-4 fw-bold text-dark">Location Master</h4>
          
          <Row className="g-4">
            {/* Left Section - Form */}
            <Col md={6}>
              <Card
                className="shadow-sm border-0 h-100"
                style={{
                  borderRadius: "12px",
                  background: "rgba(248, 250, 252, 0.8)",
                  border: "1px solid rgba(226, 232, 240, 0.8)",
                }}
              >
                <Card.Body className="p-4">
                  <h5 className="mb-3 fw-bold text-dark">Add New Location</h5>
                  
                  {locationError && (
                    <Alert variant="danger" className="mb-3">
                      {locationError}
                    </Alert>
                  )}
                  
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Location Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={locationForm.name}
                        onChange={handleLocationFormChange}
                        placeholder="Enter location name"
                        style={{
                          borderRadius: "8px",
                          border: "2px solid #e2e8f0",
                          fontSize: "0.9rem",
                          padding: "8px 12px",
                        }}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Status</Form.Label>
                      <Form.Select
                        name="status"
                        value={locationForm.status}
                        onChange={handleLocationFormChange}
                        style={{
                          borderRadius: "8px",
                          border: "2px solid #e2e8f0",
                          fontSize: "0.9rem",
                          padding: "8px 12px",
                        }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </Form.Group>
                    
                    <div className="d-flex gap-2 mt-4">
                      <Button
                        variant="primary"
                        onClick={handleLocationSave}
                        disabled={locationLoading}
                        className="flex-fill d-flex align-items-center justify-content-center"
                        style={{
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px 20px",
                          fontSize: "0.9rem",
                          fontWeight: "500",
                        }}
                      >
                        {locationLoading ? (
                          <FaSpinner className="me-2 fa-spin" />
                        ) : (
                          <FaSave className="me-2" />
                        )}
                        {editingLocation ? 'Update' : 'Save'}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={handleLocationClear}
                        className="flex-fill d-flex align-items-center justify-content-center"
                        style={{
                          borderRadius: "8px",
                          padding: "10px 20px",
                          fontSize: "0.9rem",
                          fontWeight: "500",
                        }}
                      >
                        <FaTimes className="me-2" />
                        Clear
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Right Section - List */}
            <Col md={12}>
              <Card
                className="shadow-sm border-0 h-100"
                style={{
                  borderRadius: "12px",
                  background: "rgba(248, 250, 252, 0.8)",
                  border: "1px solid rgba(226, 232, 240, 0.8)",
                }}
              >
                <Card.Body className="p-4">
                  <h5 className="mb-3 fw-bold text-dark">Existing Locations</h5>
                  
                  <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                    {locationLoading ? (
                      <div className="text-center py-4">
                        <FaSpinner className="fa-spin me-2" />
                        <span>Loading locations...</span>
                      </div>
                    ) : locations.length === 0 ? (
                      <div className="text-center text-muted py-4">
                        <p>No locations found</p>
                      </div>
                    ) : (
                      <ListGroup variant="flush">
                        {locations.map((location) => (
                          <ListGroup.Item
                            key={location._id}
                            className="border-0 mb-2 p-3"
                            style={{
                              background: "rgba(255, 255, 255, 0.8)",
                              borderRadius: "8px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                            onClick={() => handleLocationEdit(location)}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="flex-grow-1">
                                <h6 className="mb-1 fw-bold text-dark">{location.name}</h6>
                                <small className={`badge ${location.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                  {location.status}
                                </small>
                              </div>
                              <div className="d-flex gap-2">
                                <Button
                                  variant={location.status === 'active' ? 'outline-warning' : 'outline-success'}
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLocationToggleStatus(location._id);
                                  }}
                                  style={{ borderRadius: "6px", padding: "4px 8px" }}
                                  title={`${location.status === 'active' ? 'Deactivate' : 'Activate'} location`}
                                >
                                  {location.status === 'active' ? <FaToggleOn size={12} /> : <FaToggleOff size={12} />}
                                </Button>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLocationEdit(location);
                                  }}
                                  style={{ borderRadius: "6px", padding: "4px 8px" }}
                                >
                                  <FaEdit size={12} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLocationDelete(location._id);
                                  }}
                                  style={{ borderRadius: "6px", padding: "4px 8px" }}
                                >
                                  <FaTrash size={12} />
                                </Button>
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </motion.div>
  );

  // Render User Management Section
  const renderUserSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-4"
    >
      <Card
        className="shadow-lg border-0"
        style={{
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <Card.Body className="p-4">
          <h4 className="mb-4 fw-bold text-dark">User Management</h4>
          
          <Row className="g-4">
            {/* Users List - Full Width */}
            <Col md={12}>
              <Card
                className="shadow-sm border-0 h-100"
                style={{
                  borderRadius: "12px",
                  background: "rgba(248, 250, 252, 0.8)",
                  border: "1px solid rgba(226, 232, 240, 0.8)",
                }}
              >
                <Card.Body className="p-4">
                  <h5 className="mb-3 fw-bold text-dark">Existing Users</h5>
                  
                  {userError && (
                    <Alert variant="danger" className="mb-3">
                      {userError}
                    </Alert>
                  )}
                  
                  <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                    {userLoading ? (
                      <div className="text-center py-4">
                        <FaSpinner className="fa-spin me-2" />
                        <span>Loading users...</span>
                      </div>
                    ) : users.length === 0 ? (
                      <div className="text-center text-muted py-4">
                        <p>No users found</p>
                      </div>
                    ) : (
                      <ListGroup variant="flush">
                        {users.map((user) => (
                          <ListGroup.Item
                            key={user._id}
                            className="border-0 mb-2 p-3"
                            style={{
                              background: "rgba(255, 255, 255, 0.8)",
                              borderRadius: "8px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                            onClick={() => handleUserEdit(user)}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="flex-grow-1">
                                <h6 className="mb-1 fw-bold text-dark">{user.name}</h6>
                                <small className="text-muted d-block">ID: {user.doctorId}</small>
                                <small className="text-muted d-block">Location: {user.location}</small>
                                <div className="mt-1">
                                  <small className={`badge me-2 ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                                    {user.role}
                                  </small>
                                  <small className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                    {user.status}
                                  </small>
                                </div>
                              </div>
                              <div className="d-flex gap-2">
                                <Button
                                  variant={user.status === 'active' ? 'outline-warning' : 'outline-success'}
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUserToggleStatus(user._id);
                                  }}
                                  style={{ borderRadius: "6px", padding: "4px 8px" }}
                                  title={`${user.status === 'active' ? 'Deactivate' : 'Activate'} user`}
                                >
                                  {user.status === 'active' ? <FaToggleOn size={12} /> : <FaToggleOff size={12} />}
                                </Button>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUserEdit(user);
                                  }}
                                  style={{ borderRadius: "6px", padding: "4px 8px" }}
                                >
                                  <FaEdit size={12} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUserDelete(user._id);
                                  }}
                                  style={{ borderRadius: "6px", padding: "4px 8px" }}
                                >
                                  <FaTrash size={12} />
                                </Button>
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </motion.div>
  );

  // Render main layout with sidebar
  return (
    <div
      className="min-vh-100"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Pattern Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%)
        `,
          pointerEvents: "none",
        }}
      ></div>

      <div className="d-flex" style={{ minHeight: "100vh" }}>
        {/* Left Sidebar */}
        <div
          style={{
            width: "250px",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            borderRight: "1px solid rgba(255, 255, 255, 0.2)",
            padding: "20px",
            position: "fixed",
            height: "100vh",
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          <div className="mb-4">
            <Button
              variant="link"
              onClick={() => navigate("/home")}
              className="text-decoration-none p-0 mb-3"
              style={{ color: "#667eea", fontWeight: "500" }}
            >
              <FaArrowLeft className="me-2" />
              Back to Home
            </Button>
           
          </div>

          <div className="d-flex flex-column gap-2">
            {/* Doctors Menu Item */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={`p-3 rounded-3 cursor-pointer d-flex align-items-center ${
                  currentView === 'doctors' ? 'bg-primary text-white' : 'bg-light text-dark'
                }`}
                onClick={handleDoctorsClick}
                style={{
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  borderRadius: "12px",
                  border: currentView === 'doctors' ? "2px solid #667eea" : "2px solid transparent",
                }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: currentView === 'doctors' 
                      ? "rgba(255, 255, 255, 0.2)" 
                      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: currentView === 'doctors' ? "white" : "white",
                    fontSize: "1rem",
                  }}
                >
                  👨‍⚕️
                </div>
                <div>
                  <div className="fw-bold">Doctors</div>
                  <small className={currentView === 'doctors' ? 'text-white-50' : 'text-muted'}>
                    Manage doctor data
                  </small>
                </div>
              </div>
            </motion.div>

            {/* ICU Consultants Menu Item */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={`p-3 rounded-3 cursor-pointer d-flex align-items-center ${
                  currentView === 'icu' ? 'bg-primary text-white' : 'bg-light text-dark'
                }`}
                onClick={handleIcuConsultantClick}
                style={{
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  borderRadius: "12px",
                  border: currentView === 'icu' ? "2px solid #667eea" : "2px solid transparent",
                }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: currentView === 'icu' 
                      ? "rgba(255, 255, 255, 0.2)" 
                      : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    fontSize: "1rem",
                  }}
                >
                  ⚕️
                </div>
                <div>
                  <div className="fw-bold">ICU</div>
                  <small className={currentView === 'icu' ? 'text-white-50' : 'text-muted'}>
                    Manage ICU consultants
                  </small>
                </div>
              </div>
            </motion.div>

            {/* Location Menu Item */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={`p-3 rounded-3 cursor-pointer d-flex align-items-center ${
                  currentView === 'locations' ? 'bg-primary text-white' : 'bg-light text-dark'
                }`}
                onClick={handleLocationsClick}
                style={{
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  borderRadius: "12px",
                  border: currentView === 'locations' ? "2px solid #667eea" : "2px solid transparent",
                }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: currentView === 'locations' 
                      ? "rgba(255, 255, 255, 0.2)" 
                      : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    color: "white",
                    fontSize: "1rem",
                  }}
                >
                  📍
                </div>
                <div>
                  <div className="fw-bold">Location</div>
                  <small className={currentView === 'locations' ? 'text-white-50' : 'text-muted'}>
                    Manage locations
                  </small>
                </div>
              </div>
            </motion.div>

            {/* Users Menu Item */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={`p-3 rounded-3 cursor-pointer d-flex align-items-center ${
                  currentView === 'users' ? 'bg-primary text-white' : 'bg-light text-dark'
                }`}
                onClick={handleUsersClick}
                style={{
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  borderRadius: "12px",
                  border: currentView === 'users' ? "2px solid #667eea" : "2px solid transparent",
                }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: currentView === 'users' 
                      ? "rgba(255, 255, 255, 0.2)" 
                      : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                    color: "white",
                    fontSize: "1rem",
                  }}
                >
                  👥
                </div>
                <div>
                  <div className="fw-bold">Users</div>
                  <small className={currentView === 'users' ? 'text-white-50' : 'text-muted'}>
                    Manage user accounts
                  </small>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Content Area */}
        <div
          style={{
            marginLeft: "250px",
            flex: 1,
            padding: "20px",
            minHeight: "100vh",
          }}
        >
          <AnimatePresence mode="wait">
            {currentView === 'menu' && (
              <motion.div
                key="menu-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="d-flex align-items-center justify-content-center"
                style={{ minHeight: "calc(100vh - 40px)" }}
              >
                <div className="text-center">
                  <h2 className="text-white mb-3">Welcome to Masters Management</h2>
                  <p className="text-white-50">Select a master from the sidebar to get started</p>
                </div>
              </motion.div>
            )}
            
            {currentView === 'doctors' && (
              <motion.div
                key="doctors-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderDoctorSection()}
              </motion.div>
            )}
            
            {currentView === 'icu' && (
              <motion.div
                key="icu-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderIcuSection()}
              </motion.div>
            )}
            
            {currentView === 'locations' && (
              <motion.div
                key="locations-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderLocationSection()}
              </motion.div>
            )}

            {currentView === 'users' && (
              <motion.div
                key="users-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderUserSection()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Masters; 