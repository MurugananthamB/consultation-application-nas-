import React, { useState, useEffect } from "react";
import {
  Container,
  Form,
  Button,
  Card,
  Row,
  Col,
  Alert,
  InputGroup,
} from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaHospital,
  FaCode,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const DoctorLogin = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [formData, setFormData] = useState({
    doctorId: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !loading) {
      console.log("User already logged in, redirecting to home");
      navigate("/home", { replace: true });
    }
  }, [user, navigate, loading]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setDebugInfo("");
    setLoading(true);

    try {
      console.log("Attempting login with:", formData);

      // Make login request
      const loggedInUser = await login(formData);
      console.log("Login successful, user:", loggedInUser);

      setSuccess("Login successful!");
      // Navigation will be handled by the useEffect when user state updates
    } catch (err) {
      console.error("Login error:", err);

      // Handle specific error types
      let errorMessage = "Login failed. Please try again.";

      if (err.response?.data?.message) {
        const serverMessage = err.response.data.message;

        // Check for specific error patterns
        if (
          serverMessage.includes("Doctor ID does not exist") ||
          serverMessage.includes("Invalid credentials - Doctor ID")
        ) {
          errorMessage = "Doctor ID not found. Please check your Doctor ID.";
        } else if (
          serverMessage.includes("Incorrect password") ||
          serverMessage.includes("Invalid credentials - Incorrect password")
        ) {
          errorMessage = "Incorrect password. Please check your password.";
        } else if (serverMessage.includes("Invalid credentials")) {
          errorMessage =
            "Invalid Doctor ID or password. Please check your credentials.";
        } else {
          errorMessage = serverMessage;
        }
      } else if (err.message) {
        if (
          err.message.includes("Network Error") ||
          err.message.includes("Failed to fetch")
        ) {
          errorMessage =
            "Connection error. Please check your internet connection.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)",
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card
                className="shadow-lg border-0 overflow-hidden"
                style={{
                  borderRadius: "25px",
                  background: "white",
                  minHeight: "600px",
                }}
              >
                <Row className="g-0 h-100">
                  {/* Left Section - Doctor Character */}
                  <Col lg={6} className="position-relative d-none d-lg-block">
                    <div
                      className="h-100 d-flex flex-column justify-content-center align-items-center position-relative"
                      style={{
                        background:
                          "linear-gradient(135deg, #ffffff 0%, #e8f5e8 100%)",
                      }}
                    >
                      {/* Background Decorative Elements */}
                      <div className="position-absolute top-0 start-0 w-100 h-100">
                        <div
                          className="position-absolute"
                          style={{
                            top: "20%",
                            left: "15%",
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            background: "rgba(255, 193, 7, 0.2)",
                            border: "2px dashed rgba(255, 193, 7, 0.3)",
                          }}
                        ></div>
                        <div
                          className="position-absolute"
                          style={{
                            top: "60%",
                            left: "10%",
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "rgba(33, 150, 243, 0.2)",
                            border: "2px dashed rgba(33, 150, 243, 0.3)",
                          }}
                        ></div>
                        <div
                          className="position-absolute"
                          style={{
                            top: "30%",
                            right: "20%",
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                            background: "rgba(76, 175, 80, 0.2)",
                            border: "2px dashed rgba(76, 175, 80, 0.3)",
                          }}
                        ></div>
                        <div
                          className="position-absolute"
                          style={{
                            top: "70%",
                            right: "15%",
                            width: "35px",
                            height: "35px",
                            borderRadius: "50%",
                            background: "rgba(156, 39, 176, 0.2)",
                            border: "2px dashed rgba(156, 39, 176, 0.3)",
                          }}
                        ></div>
                      </div>

                      {/* Doctor Character */}
                      <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="position-relative z-index-1 text-center"
                      >
                        <div className="mb-4">
                          <div className="position-relative d-inline-block">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: "120px",
                                height: "120px",
                                background:
                                  "linear-gradient(135deg, #4caf50, #66bb6a)",
                                boxShadow: "0 10px 30px rgba(76, 175, 80, 0.3)",
                              }}
                            >
                              <FaHospital size={50} className="text-white" />
                            </div>
                            {/* Doctor Character Peeking */}
                            <div
                              className="position-absolute"
                              style={{
                                top: "-20px",
                                right: "-30px",
                                width: "80px",
                                height: "80px",
                                background:
                                  "linear-gradient(135deg, #ffb74d, #ffcc02)",
                                borderRadius: "50%",
                                border: "4px solid white",
                                boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                              }}
                            >
                              <div className="d-flex align-items-center justify-content-center h-100">
                                <span style={{ fontSize: "2rem" }}>👨‍⚕️</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.6, duration: 0.6 }}
                        >
                          <h2
                            className="fw-bold mb-3"
                            style={{
                              color: "#424242",
                              fontSize: "2.2rem",
                            }}
                          >
                            HELLO!
                          </h2>
                          <p
                            className="text-muted mb-0"
                            style={{
                              fontSize: "1.1rem",
                              color: "#757575",
                            }}
                          >
                            Please enter your details to continue
                          </p>
                        </motion.div>
                      </motion.div>
                    </div>
                  </Col>

                  {/* Right Section - Login Form */}
                  <Col
                    lg={6}
                    className="d-flex align-items-center justify-content-center p-4 p-lg-5"
                  >
                    <motion.div
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.8 }}
                      className="w-100"
                      style={{ maxWidth: "400px" }}
                    >
                      {/* Hospital Logo */}
                      <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="text-center mb-4"
                      >
                        {/* Logo Image */}
                        <div className="mb-3">
                          <img
                            src="/logo.png"
                            alt="Hospital Logo"
                            className="img-fluid"
                            style={{
                              maxHeight: "100px",
                              maxWidth: "300px",
                            }}
                            onError={(e) => {
                              // Fallback to text if logo image fails to load
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "block";
                            }}
                          />
                          <h3
                            className="fw-bold mb-0"
                            style={{ color: "#4caf50", display: "none" }}
                          >
                            LOGO Hospital
                          </h3>
                        </div>
                        <p
                          className="text-muted mb-0"
                          style={{ fontSize: "0.9rem" }}
                        >
                          <span
                            style={{
                              color: "#E30B5C",
                              fontWeight: "bold",
                              fontSize: "1.2rem",
                              textShadow: "0 1px 2px rgba(255, 0, 255, 0.2)",
                            }}
                          >
                            Adhiparasakthi Hospitals
                          </span>
                        </p>
                      </motion.div>

                      <AnimatePresence mode="sync">
                        {success && (
                          <motion.div
                            key="success"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Alert
                              variant="success"
                              className="mb-4"
                              style={{ borderRadius: "12px" }}
                            >
                              {success}
                            </Alert>
                          </motion.div>
                        )}
                        {error && (
                          <motion.div
                            key="error"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Alert
                              variant="danger"
                              className="mb-4"
                              style={{ borderRadius: "12px" }}
                            >
                              {error}
                            </Alert>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Form onSubmit={handleSubmit}>
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.8, duration: 0.6 }}
                        >
                          <Form.Group className="mb-4">
                            <Form.Label
                              className="fw-semibold mb-2"
                              style={{ color: "#424242" }}
                            >
                              Doctor ID
                            </Form.Label>
                            <Form.Control
                              type="text"
                              name="doctorId"
                              value={formData.doctorId}
                              onChange={handleChange}
                              placeholder="Enter your doctor ID"
                              required
                              style={{
                                height: "50px",
                                borderRadius: "12px",
                                border: "2px solid #e0e0e0",
                                fontSize: "1rem",
                                padding: "12px 16px",
                              }}
                              className="border-0 shadow-sm"
                            />
                          </Form.Group>
                        </motion.div>

                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.9, duration: 0.6 }}
                        >
                          <Form.Group className="mb-4">
                            <Form.Label
                              className="fw-semibold mb-2"
                              style={{ color: "#424242" }}
                            >
                              Password
                            </Form.Label>
                            <InputGroup>
                              <Form.Control
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                required
                                style={{
                                  height: "50px",
                                  borderRadius: "12px 0 0 12px",
                                  border: "2px solid #e0e0e0",
                                  fontSize: "1rem",
                                  padding: "12px 16px",
                                }}
                                className="border-0 shadow-sm"
                              />
                              <Button
                                variant="outline-secondary"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                  height: "50px",
                                  borderRadius: "0 12px 12px 0",
                                  border: "2px solid #e0e0e0",
                                  borderLeft: "none",
                                  background: "white",
                                }}
                                className="border-0 shadow-sm"
                              >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                              </Button>
                            </InputGroup>
                          </Form.Group>
                        </motion.div>

                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 1.0, duration: 0.6 }}
                        >
                          <div className="d-grid mb-4">
                            <Button
                              variant="primary"
                              type="submit"
                              disabled={loading}
                              style={{
                                height: "50px",
                                borderRadius: "12px",
                                fontSize: "1.1rem",
                                fontWeight: "600",
                                background:
                                  "linear-gradient(135deg, #2196f3, #1976d2)",
                                border: "none",
                                boxShadow: "0 4px 15px rgba(33, 150, 243, 0.3)",
                              }}
                            >
                              {loading && (
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                  aria-hidden="true"
                                />
                              )}
                              {loading ? "Logging in..." : "Log In"}
                            </Button>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 1.1, duration: 0.6 }}
                          className="text-center"
                        ></motion.div>
                      </Form>
                    </motion.div>
                  </Col>
                </Row>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>

      {/* Footer */}
      <footer
        className="footer fixed-bottom d-flex justify-content-end align-items-center px-3 py-2"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid rgba(0, 0, 0, 0.1)",
          boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
          zIndex: 1000,
        }}
      >
        <span
          className="text-muted"
          style={{
            fontSize: "0.85rem",
            fontWeight: "500",
            color: "#6c757d",
          }}
        >
          <FaCode className="me-2" style={{ color: "#007bff" }} />
          Developed by <strong style={{ color: "#007bff" }}>APH IT</strong>
        </span>
      </footer>
    </div>
  );
};

export default DoctorLogin;
