import React, { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { FaUser, FaEnvelope, FaUserShield, FaSpinner } from "react-icons/fa";

const EditProfileModal = ({ show, onHide, onSave, user }) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    department: user?.department || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // TODO: Implement actual API call to update profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      onSave(formData);
      onHide();
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Profile</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <div className="input-group">
              <span className="input-group-text">
                <FaUser className="text-primary" />
              </span>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <div className="input-group">
              <span className="input-group-text">
                <FaEnvelope className="text-primary" />
              </span>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Department</Form.Label>
            <div className="input-group">
              <span className="input-group-text">
                <FaUserShield className="text-primary" />
              </span>
              <Form.Control
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Enter your department"
              />
            </div>
          </Form.Group>

          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={loading}
          className="d-flex align-items-center"
        >
          {loading ? (
            <>
              <FaSpinner className="me-2 fa-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditProfileModal; 