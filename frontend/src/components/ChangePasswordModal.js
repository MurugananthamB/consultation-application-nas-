import React, { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { FaLock, FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";
import { authAPI } from "../services/api";

const ChangePasswordModal = ({ show, onHide, onSave }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    });
  };

  const validateForm = () => {
    if (!formData.currentPassword.trim()) {
      setError("Current password is required");
      return false;
    }
    if (!formData.newPassword.trim()) {
      setError("New password is required");
      return false;
    }
    if (!formData.confirmPassword.trim()) {
      setError("Please confirm your new password");
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return false;
    }
    if (formData.currentPassword === formData.newPassword) {
      setError("New password must be different from current password");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Call the change password API
      const response = await authAPI.changePassword({
        oldPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      console.log("Password change successful:", response.data);
      
      // Success
      onSave({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      // Reset form and close modal
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswords({
        current: false,
        new: false,
        confirm: false,
      });
      onHide();
    } catch (err) {
      console.error("Password change error:", err);
      setError(err.message || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
    setError("");
    onHide();
  };

  return (
    <Modal show={show} onHide={handleCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <FaLock className="me-2 text-primary" />
          Change Password
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Current Password</Form.Label>
            <div className="input-group">
              <span className="input-group-text">
                <FaLock className="text-muted" />
              </span>
              <Form.Control
                type={showPasswords.current ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter your current password"
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="outline-secondary"
                onClick={() => togglePasswordVisibility("current")}
                disabled={loading}
              >
                {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
              </Button>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>New Password</Form.Label>
            <div className="input-group">
              <span className="input-group-text">
                <FaLock className="text-primary" />
              </span>
              <Form.Control
                type={showPasswords.new ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter your new password"
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="outline-secondary"
                onClick={() => togglePasswordVisibility("new")}
                disabled={loading}
              >
                {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
              </Button>
            </div>

          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Confirm New Password</Form.Label>
            <div className="input-group">
              <span className="input-group-text">
                <FaLock className="text-primary" />
              </span>
              <Form.Control
                type={showPasswords.confirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="outline-secondary"
                onClick={() => togglePasswordVisibility("confirm")}
                disabled={loading}
              >
                {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
              </Button>
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
        <Button variant="secondary" onClick={handleCancel} disabled={loading}>
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
              Updating...
            </>
          ) : (
            "Update Password"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ChangePasswordModal; 