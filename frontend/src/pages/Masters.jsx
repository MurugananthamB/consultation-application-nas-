import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, ListGroup, Alert } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUserMd, FaUserNurse, FaSave, FaTimes, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../services/api';

const Masters = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for current view
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'doctors', 'icu'
  
  // State for doctors management
  const [doctors, setDoctors] = useState([]);
  const [doctorForm, setDoctorForm] = useState({ name: '' });
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorError, setDoctorError] = useState('');
  
  // State for ICU consultants management
  const [icuConsultants, setIcuConsultants] = useState([]);
  const [icuForm, setIcuForm] = useState({ name: '' });
  const [editingIcu, setEditingIcu] = useState(null);
  const [icuLoading, setIcuLoading] = useState(false);
  const [icuError, setIcuError] = useState('');

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
      const response = await fetch(`${API_URL}/masters/doctors`, {
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
      const response = await fetch(`${API_URL}/masters/icu-consultants`, {
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

  // Load data when view changes
  useEffect(() => {
    if (currentView === 'doctors') {
      fetchDoctors();
    } else if (currentView === 'icu') {
      fetchIcuConsultants();
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
    setDoctorForm({ name: '' });
    setEditingDoctor(null);
  };

  const handleDoctorEdit = (doctor) => {
    setDoctorForm({ name: doctor.name });
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
          setDoctorForm({ name: '' });
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
    setIcuForm({ name: '' });
    setEditingIcu(null);
  };

  const handleIcuEdit = (icu) => {
    setIcuForm({ name: icu.name });
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

  const handleBackToMenu = () => {
    setCurrentView('menu');
    setDoctorForm({ name: '' });
    setIcuForm({ name: '' });
    setEditingDoctor(null);
    setEditingIcu(null);
  };



  const handleDoctorsClick = () => {
    setCurrentView('doctors');
  };

  const handleIcuConsultantClick = () => {
    setCurrentView('icu');
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
                  <h5 className="mb-3 fw-bold text-dark">Existing Doctors</h5>
                  
                                     <div style={{ maxHeight: "300px", overflowY: "auto" }}>
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
                              </div>
                              <div className="d-flex gap-2">
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
                  <h5 className="mb-3 fw-bold text-dark">Existing ICU Consultants</h5>
                  
                                     <div style={{ maxHeight: "300px", overflowY: "auto" }}>
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
                              </div>
                              <div className="d-flex gap-2">
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

  

  // Render main menu
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

      <Container className="py-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            className="shadow-lg border-0"
            style={{
              borderRadius: "20px",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <Button
                  variant="link"
                  onClick={() => navigate("/home")}
                  className="text-decoration-none"
                  style={{ color: "#667eea", fontWeight: "500" }}
                >
                  <FaArrowLeft className="me-2" />
                  Back to Home
                </Button>
              </div>

              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center mb-5"
              >
                <h2 className="mb-3" style={{ color: "#2d3748", fontWeight: "600" }}>
                  Masters Management
                </h2>
                <p className="text-muted" style={{ fontSize: "1.1rem" }}>
                  Manage system masters and configurations
                </p>
              </motion.div>

              <Row className="justify-content-center">
                <Col md={6} lg={4}>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card
                      className="shadow-lg border-0 h-100"
                      style={{
                        borderRadius: "16px",
                        background: "rgba(255, 255, 255, 0.98)",
                        backdropFilter: "blur(15px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                      }}
                      onClick={handleDoctorsClick}
                    >
                      <Card.Body className="p-4">
                        <div className="d-flex align-items-center mb-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center me-3"
                            style={{
                              width: "50px",
                              height: "50px",
                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              color: "white",
                              fontSize: "1.2rem",
                              fontWeight: "bold",
                            }}
                          >
                            <FaUserMd />
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1 fw-bold text-dark">
                              Doctor's
                            </h6>
                            <small className="text-muted">
                              Manage doctor registrations and profiles
                            </small>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Col>

                <Col md={6} lg={4}>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card
                      className="shadow-lg border-0 h-100"
                      style={{
                        borderRadius: "16px",
                        background: "rgba(255, 255, 255, 0.98)",
                        backdropFilter: "blur(15px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                      }}
                      onClick={handleIcuConsultantClick}
                    >
                      <Card.Body className="p-4">
                        <div className="d-flex align-items-center mb-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center me-3"
                            style={{
                              width: "50px",
                              height: "50px",
                              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              color: "white",
                              fontSize: "1.2rem",
                              fontWeight: "bold",
                            }}
                          >
                            <FaUserNurse />
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1 fw-bold text-dark">
                              ICU Consultant
                            </h6>
                            <small className="text-muted">
                              Manage ICU consultant information
                            </small>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </motion.div>
      </Container>

      {/* Dynamic Sections */}
      <AnimatePresence mode="wait">
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
      </AnimatePresence>
    </div>
  );
};

export default Masters; 