import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // ✅ FIXED
import { useAuth } from "../context/AuthContext";
import fixWebmDuration from "webm-duration-fix";
import UserProfileCard from "../components/UserProfileCard";
import UserMenuButton from "../components/UserMenuButton";
import EditProfileModal from "../components/EditProfileModal";

import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
} from "react-bootstrap";

// Framer Motion
import { motion, AnimatePresence } from "framer-motion";

// React Icons
import {
  FaCog,
  FaFileAlt,
  FaSignOutAlt,
  FaUser,
  FaIdCard,
  FaUserNurse,
  FaUserMd,
  FaVideo,
  FaStop,
  FaSpinner,
  FaCode,
  FaCheckCircle,
  FaExclamationTriangle,
  FaExclamationCircle,
} from "react-icons/fa";
import {
  consultationAPI,
  videoAPI,
  API_URL,
  patientAPI,
  default as api,
} from "../services/api";

const Home = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [formData, setFormData] = useState({
    patientName: "",
    uhidId: "",
    attenderName: "",
    icuConsultantName: "DR SHARMILA",
    doctorName: "",
    department: "",
    conditionType: "", // New field for condition selection
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [showStorageSettings, setShowStorageSettings] = useState(false);
  const [storagePath, setStoragePath] = useState("");
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const [consultations, setConsultations] = useState([]);
  const [storageSettings, setStorageSettings] = useState({
    path: "",
    maxSize: 1024, // in MB
    allowedTypes: ["webm", "mp4"],
  });
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientError, setPatientError] = useState("");
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Fetch storage path when component mounts
  useEffect(() => {
    const fetchStoragePath = async () => {
      try {
        const response = await axios.get(`${API_URL}/get-storage-path`);
        if (response.data && response.data.path) {
          setStoragePath(response.data.path);
        }
      } catch (error) {
        console.error("Error fetching storage path:", error);
      }
    };

    fetchStoragePath();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Clear patient info when UHID is cleared
    if (e.target.name === "uhidId" && !e.target.value.trim()) {
      setPatientError("");
    }
  };

  const handleConditionChange = (condition) => {
    // Single selection behavior - only one can be selected at a time
    setFormData({
      ...formData,
      conditionType: condition,
    });
  };

  const startRecording = async () => {
    try {
      const requiredFields = ["patientName", "uhidId"];
      const emptyFields = requiredFields.filter((field) => !formData[field]);
      if (emptyFields.length > 0) {
        setError(
          `Please fill in all required fields: ${emptyFields.join(", ")}`
        );
        return;
      }

      setShowVideo(true);

      // ✅ Use wide-angle config
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: 16 / 9,
          facingMode: "user",
        },
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch((err) => {
          console.error("Error playing video:", err);
          setError("Error initializing camera");
        });
      }

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9,opus",
        videoBitsPerSecond: 3500000, // increased for better clarity
      });

      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      setError("");
      setSuccess("Recording started...");

      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const elapsedTime = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );
        setRecordingTime(elapsedTime);
      }, 1000);
    } catch (err) {
      console.error("Recording error:", err);
      setError(`Error starting recording: ${err.message}`);
      setIsRecording(false);
      setShowVideo(false);
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      setLoading(true);
      setError("");

      try {
        mediaRecorderRef.current.stop();
        setIsRecording(false);

        clearInterval(timerRef.current);
        timerRef.current = null;
        startTimeRef.current = null;

        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());

        await new Promise((resolve) => {
          mediaRecorderRef.current.onstop = () => resolve();
        });

        if (chunksRef.current.length === 0) {
          throw new Error("No video data recorded");
        }

        // Create video blob and fix duration
        const videoBlob = new Blob(chunksRef.current, { type: "video/webm" });
        const fixedBlob = await fixWebmDuration(videoBlob, recordingTime);

        // ✅ First create consultation and get MongoDB _id
        const consultationData = {
          patientName: formData.patientName,
          uhidId: formData.uhidId,
          doctor: user.id,
          doctorName: formData.doctorName,
          attenderName: formData.attenderName,
          icuConsultantName: formData.icuConsultantName,
          department: formData.department,
          conditionType: formData.conditionType,
          date: new Date().toISOString(),
          recordingDuration: recordingTime,
          status: "completed",
        };

        console.log("Creating consultation...");
        const consultationResponse = await consultationAPI.create(consultationData);
        
        if (!consultationResponse.data || !consultationResponse.data._id) {
          throw new Error("Failed to create consultation or get consultation ID");
        }

        const consultationId = consultationResponse.data._id;
        console.log("✅ Consultation created with ID:", consultationId);

        // ✅ Upload video using MongoDB _id as filename
        await handleVideoUpload(fixedBlob, consultationId);

        // ✅ Reset form
        setFormData({
          patientName: "",
          uhidId: "",
          attenderName: "",
          icuConsultantName: "",
          doctorName: "",
          department: "",
          conditionType: "",
        });
        setShowVideo(false);
        setRecordingTime(0);
        chunksRef.current = [];
        setPatientError("");
      } catch (err) {
        console.error("Error during recording stop:", err);
        setError(err.response?.data?.message || err.message || "Unknown error");
      } finally {
        setLoading(false);
        setUploading(false);
      }
    }
  };

  // ✅ New function to handle video upload using MongoDB _id as filename
  const handleVideoUpload = async (videoBlob, consultationId) => {
    // Validate required fields
    if (!consultationId) {
      throw new Error("Consultation ID is required for video upload");
    }

    setUploading(true);
    setError("");

    try {
      // ✅ Create a File object with .webm extension using consultationId
      const videoFile = new File([videoBlob], `${consultationId}.webm`, {
        type: "video/webm",
      });

      // Create FormData with MongoDB _id as consultationId
      const uploadFormData = new FormData();
      uploadFormData.append("video", videoFile);
      uploadFormData.append("consultationId", consultationId);
      
      // Format date as DD-MM-YYYY for folder structure
      const today = new Date();
      const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
      uploadFormData.append("date", formattedDate);

      console.log("Uploading video to API with consultation ID:", consultationId);
      console.log("Video filename:", `${consultationId}.webm`);

      // ✅ Use the configured API instance from api.js with the new endpoint
      const response = await api.post("/consultations/upload", uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data && response.data.success) {
        console.log("✅ Video uploaded successfully:", response.data);
        setSuccess(`📁 Video saved successfully as ${consultationId}.webm!`);
      } else {
        throw new Error(response.data?.message || "Video upload failed");
      }
    } catch (err) {
      console.error("Video upload error:", err);
      if (err.code === "ECONNABORTED") {
        throw new Error("Upload timeout. Please try again.");
      } else if (err.response?.status === 413) {
        throw new Error(
          "Video file too large. Please try a shorter recording."
        );
      } else if (err.response?.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      } else {
        throw new Error(
          err.response?.data?.message ||
            err.message ||
            "Upload failed. Please try again."
        );
      }
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleLogout = () => {
    logout();
    navigate("/doctor-login");
  };

  const toggleUserProfile = () => {
    setShowUserProfile(!showUserProfile);
  };

  const closeUserProfile = () => {
    setShowUserProfile(false);
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
    setShowUserProfile(false); // Close profile dropdown when opening edit modal
  };

  const handleSaveProfile = (updatedData) => {
    // TODO: Implement actual profile update logic
    console.log("Profile updated:", updatedData);
    setSuccess("Profile updated successfully!");
    setShowEditProfile(false);
  };

  // Handle click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserProfile) {
        // Check if click is outside the user menu button and profile card
        const userMenuButton = document.querySelector('[data-user-menu]');
        const profileCard = document.querySelector('[data-profile-card]');
        
        if (userMenuButton && !userMenuButton.contains(event.target) &&
            profileCard && !profileCard.contains(event.target)) {
          setShowUserProfile(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserProfile]);

  const handleStorageSettings = async () => {
    if (user?.role !== "admin") return;

    try {
      const response = await axios.post(`${API_URL}/update-storage-path`, {
        newStoragePath: storagePath,
      });

      if (response.data.success) {
        setSuccess("Storage path updated successfully");
        setShowStorageSettings(false);
      }
    } catch (err) {
      setError("Failed to update storage path");
    }
  };

  const fetchPatientByUhid = async (uhid) => {
    try {
      if (!uhid) return;
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/consultations/uhid/${uhid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && res.data.data) {
        setFormData({
          patientName: res.data.data.patientName || "",
          uhidId: res.data.data.uhidId || uhid,
          attenderName: res.data.data.attenderName || "",
          icuConsultantName: res.data.data.icuConsultantName || "",
          doctorName: res.data.data.doctorName || "",
          department: res.data.data.department || "",
        });
      }
    } catch (err) {
      setFormData((prev) => ({
        ...prev,
        patientName: "",
        attenderName: "",
        icuConsultantName: "",
        doctorName: "",
        department: "",
      }));
      // Optionally show error: setError('No patient found for this UHID');
    }
  };

  const fetchPatientInfo = async (uhid) => {
    if (!uhid.trim()) {
      setPatientError("");
      return;
    }

    setPatientLoading(true);
    setPatientError("");

    try {
      const response = await patientAPI.getByUhid(uhid.trim());

      if (response.data) {
        // Auto-fill the form with patient data
        setFormData((prev) => ({
          ...prev,
          patientName: response.data.name || "",
          department: response.data.department || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching patient:", error);
      setPatientError(error.response?.data?.message || "Patient not found");
      // Clear patient-related fields
      setFormData((prev) => ({
        ...prev,
        patientName: "",
        department: "",
      }));
    } finally {
      setPatientLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
      <div
        className="min-vh-100"
        style={{
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        <Container className="py-5" style={{ marginBottom: "60px" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Row className="justify-content-center">
              <Col md={8} lg={6}>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <Card
                    className="shadow-lg border-0"
                    style={{
                      borderRadius: "20px",
                      background: "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                        >
                          <h3 className="mb-0">New Consultation</h3>
                          <p className="text-muted">
                            Record a new patient consultation
                          </p>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="d-flex gap-2"
                        >
                          {user?.role === "admin" && (
                            <Button
                              variant="outline-primary"
                              onClick={() =>
                                setShowStorageSettings(!showStorageSettings)
                              }
                              className="me-2"
                            >
                              <FaCog className="me-2" />
                              Storage Settings
                            </Button>
                          )}
                          <Button
                            variant="primary"
                            onClick={() => navigate("/report")}
                          >
                            <FaFileAlt className="me-2" />
                            Reports
                          </Button>
                        </motion.div>
                      </div>

                      {/* {showStorageSettings && user?.role === 'admin' && (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="mb-4 p-3 border rounded"
  >
    <h5>Storage Settings</h5>
    <Form.Group className="mb-3">
      <Form.Label>Current Storage Path</Form.Label>
      <Form.Control
        type="text"
        value={storagePath}
        onChange={(e) => setStoragePath(e.target.value)}
        placeholder="Enter storage path"
      />
      <Form.Text className="text-muted">
        Current path where videos are being stored
      </Form.Text>
    </Form.Group>
    <Button variant="primary" onClick={handleStorageSettings}>
      Update Path
    </Button>
  </motion.div>
)} */}

                      <AnimatePresence mode="sync">
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            key="error"
                          >
                            <Alert variant="danger" className="mb-3">
                              {error}
                            </Alert>
                          </motion.div>
                        )}
                        {success && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            key="success"
                          >
                            <Alert variant="success" className="mb-3">
                              {success}
                            </Alert>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Form>
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.6, duration: 0.5 }}
                        >
                          <Form.Group className="mb-2">
                            <Form.Label className="fw-bold">UHID</Form.Label>
                            <div className="input-group">
                              <span className="input-group-text bg-white border-end-0">
                                <FaIdCard className="text-primary" />
                              </span>
                              <Form.Control
                                type="text"
                                name="uhidId"
                                value={formData.uhidId}
                                onChange={handleChange}
                                placeholder="Enter UHID"
                                required
                                disabled={isRecording}
                                className="border-start-0"
                                style={{ height: "45px" }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    fetchPatientInfo(e.target.value.trim());
                                  }
                                }}
                              />
                            </div>
                          </Form.Group>
                        </motion.div>

                        {/* Patient Loading and Error States */}
                        <AnimatePresence mode="sync">
                          {patientLoading && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.3 }}
                              key="patient-loading"
                            >
                              <Alert variant="info" className="mb-2">
                                <FaSpinner className="me-2 fa-spin" />
                                Loading patient information...
                              </Alert>
                            </motion.div>
                          )}

                          {patientError && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.3 }}
                              key="patient-error"
                            >
                              <Alert variant="danger" className="mb-2">
                                <FaUser className="me-2" />
                                {patientError}
                              </Alert>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.7, duration: 0.5 }}
                        >
                          <Form.Group className="mb-2">
                            <Form.Label className="fw-bold">
                              Patient Name
                            </Form.Label>
                            <div className="input-group">
                              <span className="input-group-text bg-white border-end-0">
                                <FaUser className="text-primary" />
                              </span>
                              <Form.Control
                                type="text"
                                name="patientName"
                                value={formData.patientName}
                                onChange={handleChange}
                                placeholder="Enter patient name"
                                required
                                disabled={isRecording}
                                className="border-start-0"
                                style={{ height: "45px" }}
                              />
                            </div>
                          </Form.Group>
                        </motion.div>

                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.8, duration: 0.5 }}
                        >
                          <Form.Group className="mb-2">
                            <Form.Label className="fw-bold">
                              Department
                            </Form.Label>
                            <div className="input-group">
                              <span className="input-group-text bg-white border-end-0">
                                <FaUserMd className="text-primary" />
                              </span>
                              <Form.Control
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                placeholder="Enter department"
                                disabled={isRecording}
                                className="border-start-0"
                                style={{ height: "45px" }}
                              />
                            </div>
                          </Form.Group>
                        </motion.div>

                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.9, duration: 0.5 }}
                        >
                          <Form.Group className="mb-2">
                            <Form.Label className="fw-bold">
                              Attender Name
                            </Form.Label>
                            <div className="input-group">
                              <span className="input-group-text bg-white border-end-0">
                                <FaUserNurse className="text-primary" />
                              </span>
                              <Form.Control
                                type="text"
                                name="attenderName"
                                value={formData.attenderName}
                                onChange={handleChange}
                                placeholder="Enter attender name"
                                disabled={isRecording}
                                className="border-start-0"
                                style={{ height: "45px" }}
                              />
                            </div>
                          </Form.Group>
                        </motion.div>

                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.9, duration: 0.5 }}
                        >
                          <Form.Group className="mb-2">
                            <Form.Label className="fw-bold">
                              Doctor Name
                            </Form.Label>
                            <div className="input-group">
                              <span className="input-group-text bg-white border-end-0">
                                <FaUserMd className="text-primary" />
                              </span>
                              <Form.Control
                                type="text"
                                name="doctorName"
                                value={formData.doctorName}
                                onChange={handleChange}
                                placeholder="Enter doctor name"
                                disabled={isRecording}
                                className="border-start-0"
                                style={{ height: "45px" }}
                              />
                            </div>
                          </Form.Group>
                        </motion.div>

                                                {/* Condition Type Cards */}
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.95, duration: 0.5 }}
                        >
                          <Form.Group className="mb-2">
                            <Form.Label className="fw-bold">
                              Condition Type
                            </Form.Label>
                            <div className="row g-2">
                              {[
                                { 
                                  value: "normal", 
                                  label: "Normal", 
                                  color: "success", 
                                  icon: FaCheckCircle,
                                  gradient: "from-green-50 to-green-100",
                                  borderColor: "border-success",
                                  textColor: "text-success",
                                  selectedBg: "bg-success",
                                  selectedText: "text-white"
                                },
                                { 
                                  value: "icu", 
                                  label: "ICU", 
                                  color: "warning", 
                                  icon: FaExclamationTriangle,
                                  gradient: "from-yellow-50 to-yellow-100",
                                  borderColor: "border-warning",
                                  textColor: "text-warning",
                                  selectedBg: "bg-warning",
                                  selectedText: "text-white"
                                },
                                { 
                                  value: "critical", 
                                  label: "Critical", 
                                  color: "danger", 
                                  icon: FaExclamationCircle,
                                  gradient: "from-red-50 to-red-100",
                                  borderColor: "border-danger",
                                  textColor: "text-danger",
                                  selectedBg: "bg-danger",
                                  selectedText: "text-white"
                                },
                              ].map((option) => {
                                const IconComponent = option.icon;
                                const isSelected = formData.conditionType === option.value;
                                return (
                                  <div key={option.value} className="col-12 col-md-4">
                                    <motion.div
                                      whileHover={{ 
                                        scale: isRecording ? 1 : 1.02,
                                        y: isRecording ? 0 : -2
                                      }}
                                      whileTap={{ scale: isRecording ? 1 : 0.98 }}
                                      animate={{
                                        scale: isSelected ? 1.02 : 1,
                                      }}
                                      onClick={() => !isRecording && handleConditionChange(option.value)}
                                      className={`card h-100 border-0 shadow-sm position-relative overflow-hidden ${
                                        isSelected 
                                          ? `${option.selectedBg} ${option.selectedText} shadow-lg` 
                                          : `bg-white ${option.textColor}`
                                      }`}
                                      style={{
                                        cursor: isRecording ? "not-allowed" : "pointer",
                                        transition: "all 0.3s ease",
                                        border: isSelected ? "2px solid transparent" : "2px solid #e9ecef",
                                        background: isSelected 
                                          ? `linear-gradient(135deg, var(--bs-${option.color}) 0%, var(--bs-${option.color}-dark) 100%)`
                                          : `linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)`,
                                        minHeight: "64px"
                                      }}
                                    >
                                      {/* Background gradient overlay */}
                                      {!isSelected && (
                                        <div 
                                          className="position-absolute w-100 h-100 opacity-10"
                                          style={{
                                            background: `linear-gradient(135deg, var(--bs-${option.color}) 0%, var(--bs-${option.color}-light) 100%)`,
                                            top: 0,
                                            left: 0,
                                            zIndex: 0
                                          }}
                                        />
                                      )}
                                      
                                      <div className="card-body d-flex flex-column align-items-center justify-content-center py-1 px-2 position-relative" style={{ zIndex: 1 }}>
                                        <div className="text-center">
                                          <div className="mb-1">
                                            <IconComponent 
                                              size={18} 
                                              className={isSelected ? "text-white" : option.textColor}
                                            />
                                          </div>
                                          <h6 className={`fw-bold mb-0 ${isSelected ? "text-white" : option.textColor}`} style={{ fontSize: "0.8rem" }}>
                                            {option.label}
                                          </h6>
                                          {isSelected && (
                                            <motion.div
                                              initial={{ opacity: 0, scale: 0.8 }}
                                              animate={{ opacity: 1, scale: 1 }}
                                              className="mt-1"
                                            >
                                              <small className="text-white-50" style={{ fontSize: "0.65rem" }}>✓ Selected</small>
                                            </motion.div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Selection indicator */}
                                      {isSelected && (
                                        <motion.div
                                          initial={{ opacity: 0, scale: 0 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          className="position-absolute top-0 end-0 m-1"
                                        >
                                          <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "18px", height: "18px" }}>
                                            <FaCheckCircle size={8} className="text-success" />
                                          </div>
                                        </motion.div>
                                      )}
                                    </motion.div>
                                  </div>
                                );
                              })}
                            </div>
                          </Form.Group>
                        </motion.div>

                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 1.0, duration: 0.5 }}
                        >
                          <Form.Group className="mb-2">
                            <Form.Label className="fw-bold">
                              ICU Consultant
                            </Form.Label>
                            <div className="input-group">
                              <span className="input-group-text bg-white border-end-0">
                                <FaUserMd className="text-primary" />
                              </span>
                              <Form.Control
                                type="text"
                                name="icuConsultantName"
                                value={formData.icuConsultantName}
                                onChange={handleChange}
                                placeholder="Enter ICU consultant name"
                                disabled={isRecording}
                                className="border-start-0"
                                style={{ height: "45px" }}
                              />
                            </div>
                          </Form.Group>
                        </motion.div>

                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 1.1, duration: 0.5 }}
                          className="mb-3"
                        >
                          <div className="d-flex justify-content-center gap-3">
                            {!isRecording ? (
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  variant="primary"
                                  onClick={startRecording}
                                  disabled={loading}
                                  className="d-flex align-items-center"
                                  style={{
                                    background:
                                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                    border: "none",
                                    padding: "12px 24px",
                                    borderRadius: "10px",
                                    fontSize: "1.1rem",
                                    fontWeight: "bold",
                                  }}
                                >
                                  <FaVideo className="me-2" />
                                  Start Recording
                                </Button>
                              </motion.div>
                            ) : (
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  variant="danger"
                                  onClick={stopRecording}
                                  disabled={loading || uploading}
                                  className="d-flex align-items-center"
                                  style={{
                                    padding: "12px 24px",
                                    borderRadius: "10px",
                                    fontSize: "1.1rem",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {uploading ? (
                                    <>
                                      <FaSpinner className="me-2 fa-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <FaStop className="me-2" />
                                      Stop Recording (
                                      {formatTime(recordingTime)})
                                    </>
                                  )}
                                </Button>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>

                        {showVideo && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            style={{
                              position: "fixed",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              width: "100%",
                              height: "100%",
                              zIndex: 1050,
                              backgroundColor: "#000",
                              overflow: "hidden",
                            }}
                          >
                            <video
                              ref={videoRef}
                              autoPlay
                              muted
                              playsInline
                              style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%) scaleX(-1)",
                                width: "100%",
                                height: "auto",
                                objectFit: "cover",
                                aspectRatio: "16 / 9", // modern browsers support this
                              }}
                            />

                            {/* Recording Time Badge */}
                            {isRecording && (
                              <div className="position-absolute top-0 start-0 p-3">
                                <div className="d-flex align-items-center bg-dark bg-opacity-50 px-3 py-2 rounded-pill">
                                  <div
                                    className="me-2"
                                    style={{
                                      width: "10px",
                                      height: "10px",
                                      backgroundColor: "red",
                                      borderRadius: "50%",
                                      boxShadow: "0 0 8px red",
                                      animation: "pulse 1.2s infinite",
                                    }}
                                  ></div>
                                  <span className="text-white fw-bold">
                                    {formatTime(recordingTime)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Stop Recording Button */}
                            {isRecording && (
                              <div className="position-absolute bottom-0 start-50 translate-middle-x mb-4">
                                <Button
                                  variant="danger"
                                  onClick={stopRecording}
                                  className="d-flex align-items-center px-4 py-2 rounded-pill shadow"
                                  style={{
                                    fontWeight: "bold",
                                    fontSize: "1.1rem",
                                  }}
                                >
                                  <FaStop className="me-2" />
                                  Stop Recording
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </Form>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            </Row>
          </motion.div>
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

      {/* User Menu Button */}
      <UserMenuButton
        isOpen={showUserProfile}
        onToggle={toggleUserProfile}
        user={user}
      />

      {/* User Profile Card Dropdown */}
      <UserProfileCard
        isOpen={showUserProfile}
        onClose={closeUserProfile}
        onLogout={handleLogout}
        onEditProfile={handleEditProfile}
        user={user}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        show={showEditProfile}
        onHide={() => setShowEditProfile(false)}
        onSave={handleSaveProfile}
        user={user}
      />
    </>
  );
};

export default Home;
