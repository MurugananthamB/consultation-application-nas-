import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Modal,
  Alert,
  Spinner,
  Pagination,
} from "react-bootstrap";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaFilePdf,
  FaFileExcel,
  FaFilter,
  FaArrowLeft,
  FaPlay,
  FaEdit,
  FaCog,
  FaUserMd,
} from "react-icons/fa";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { consultationAPI, API_URL } from "../services/api";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import MultiSelect from "../components/MultiSelect.js";

const Report = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);

  const [allConsultations, setAllConsultations] = useState([]); // Store all fetched data
  const [consultations, setConsultations] = useState([]); // Store paginated data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    patientName: "",
    doctorName: "",
    uhidId: "",
    department: "",
    conditionType: "",
    location: "",
  });
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    field: "date",
    direction: "desc",
  });
  const [totalItems, setTotalItems] = useState(0);
  const [videoError, setVideoError] = useState("");
  const [currentVideoPath, setCurrentVideoPath] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoObjectUrl, setVideoObjectUrl] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editConsultation, setEditConsultation] = useState(null);
  const [editForm, setEditForm] = useState({
    patientName: "",
    doctorName: "",
    uhidId: "",
    attenderName: "",
    icuConsultantName: "",
    department: "",
    conditionType: "",
  });

  // Master data states for edit modal
  const [editDoctors, setEditDoctors] = useState([]);
  const [editIcuConsultants, setEditIcuConsultants] = useState([]);
  const [editMastersLoading, setEditMastersLoading] = useState(false);
  const [editMastersError, setEditMastersError] = useState("");
  const [editDoctorsLoaded, setEditDoctorsLoaded] = useState(false);
  const [editIcuConsultantsLoaded, setEditIcuConsultantsLoaded] = useState(false);

  // ✅ Helper function to get unique locations from consultations
  const getUniqueLocations = () => {
    const locations = allConsultations
      .map(consultation => consultation.location)
      .filter(location => location && location.trim() !== "")
      .filter((location, index, array) => array.indexOf(location) === index)
      .sort();
    return locations;
  };

  // ✅ Helper function to validate and extract consultation data
  const extractConsultationData = (responseData) => {
    if (responseData.success && responseData.data) {
      const { consultations, total } = responseData.data;
      return {
        consultations: Array.isArray(consultations) ? consultations : [],
        total: total || 0,
        type: "success_wrapper",
      };
    } else if (Array.isArray(responseData)) {
      return {
        consultations: responseData,
        total: responseData.length,
        type: "direct_array",
      };
    } else if (
      responseData.consultations &&
      Array.isArray(responseData.consultations)
    ) {
      return {
        consultations: responseData.consultations,
        total: responseData.total || responseData.consultations.length,
        type: "consultations_array",
      };
    }
    return null;
  };

  // ✅ Get sorted data by creation date (most recent first)
  const getSortedData = (data) => {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date);
      const dateB = new Date(b.createdAt || b.date);
      return dateB - dateA; // Descending order (newest first)
    });
  };

  // ✅ Client-side pagination logic with sorting by creation date
  const getPaginatedData = (data, page, pageSize) => {
    const sortedData = getSortedData(data);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  };

  // ✅ Update paginated data when allConsultations, currentPage, or itemsPerPage changes
  useEffect(() => {
    if (allConsultations.length > 0) {
      const paginatedData = getPaginatedData(
        allConsultations,
        currentPage,
        itemsPerPage
      );
      setConsultations(paginatedData);
      setTotalItems(allConsultations.length);

      console.log(
        `📄 Pagination: Page ${currentPage}, Size ${itemsPerPage}, Showing ${paginatedData.length} of ${allConsultations.length} records (sorted by most recent first)`
      );

      // Debug: Show first few records and their dates
      if (paginatedData.length > 0) {
        console.log("📅 First 3 records on this page:");
        paginatedData.slice(0, 3).forEach((record, index) => {
          const date = new Date(record.createdAt || record.date);
          console.log(
            `  ${index + 1}. ${record.patientName} - ${date.toLocaleString()}`
          );
        });
      }
    }
  }, [allConsultations, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchConsultations();
  }, [sortConfig, filters]); // Remove currentPage and itemsPerPage from dependencies

  // ✅ Cleanup effect for video element and object URLs
  useEffect(() => {
    return () => {
      // Clean up object URLs to prevent memory leaks
      if (currentVideoPath && currentVideoPath.startsWith("blob:")) {
        URL.revokeObjectURL(currentVideoPath);
      }
    };
  }, [currentVideoPath]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Fetching consultations with params:", {
        ...filters,
        sortField: sortConfig.field,
        sortDirection: sortConfig.direction,
      });

      // Use the new /videos/filter API endpoint - fetch all data for client-side pagination
      const response = await api.get("/videos/filter", {
        params: {
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          uhid: filters.uhidId,
          patientName: filters.patientName,
          department: filters.department,
          doctorName: filters.doctorName,
          conditionType: filters.conditionType,
          location: filters.location,
          sortField: sortConfig.field,
          sortDirection: sortConfig.direction,
        },
      });

      console.log("Raw response:", response);
      console.log("Response status:", response.status);
      console.log("Response data type:", typeof response.data);
      console.log("Response data structure:", Object.keys(response.data || {}));

      // ✅ Improved response validation using helper function
      if (response && response.status === 200) {
        const responseData = response.data;
        const extractedData = extractConsultationData(responseData);

        if (extractedData) {
          console.log(
            `✅ ${extractedData.type} response - All Consultations:`,
            extractedData.consultations
          );
          console.log(
            `✅ ${extractedData.type} response - Total items:`,
            extractedData.total
          );
          setAllConsultations(extractedData.consultations); // Store all data
          setTotalItems(extractedData.total);
        } else {
          // Invalid response format
          console.error("❌ Invalid API response format:", responseData);
          setError("Invalid response format from server");
        }
      } else {
        // HTTP error
        console.error("❌ HTTP error response:", response);
        setError("Server returned an error response");
      }
    } catch (err) {
      console.error("❌ Error fetching consultations:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch consultations"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSort = (field) => {
    setSortConfig((prevConfig) => ({
      field,
      direction:
        prevConfig.field === field && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleItemsPerPageChange = (e) => {
    const newPageSize = Number(e.target.value);
    setItemsPerPage(newPageSize);
    setCurrentPage(1); // Reset to first page when items per page change
    console.log(`📄 Page size changed to: ${newPageSize}, reset to page 1`);
  };

  const applyFilters = async () => {
    setCurrentPage(1); // Reset to first page when applying filters
    console.log("🔍 Applying filters, reset to page 1");
    fetchConsultations();
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      patientName: "",
      doctorName: "",
      uhidId: "",
      department: "",
      conditionType: "",
      location: "",
    });
    setCurrentPage(1);
    console.log("🧹 Clearing filters, reset to page 1");
    // Automatically fetch consultations after clearing filters
    setTimeout(() => fetchConsultations(), 100);
  };

  const exportToPDF = () => {
    try {
      if (consultations.length === 0) {
        alert("No data to export");
        return;
      }

      // Create new PDF document in A4 size
      const doc = new jsPDF("p", "mm", "a4");

      // Add title with timestamp
      const now = new Date();
      const timestamp = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-GB');
      doc.setFontSize(16);
      doc.text("Consultation Report", 105, 10, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Generated on: ${timestamp}`, 105, 18, { align: "center" });

      // Add table using autoTable
      autoTable(doc, {
        startY: 25,
        head: [
          [
            "Date & Time",
            "UHID",
            "Patient Name",
            "Department",
            "Doctor",
            "Attender",
            "ICU Consultant",
            "Location",
            "Duration",
            "Condition",
          ],
        ],
        body: consultations.map((item) => [
          new Date(item.date).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          }),
          item.uhidId || "-",
          item.patientName || "-",
          item.department || "-",
          item.doctorName || "-",
          item.attenderName || "-",
          item.icuConsultantName || "-",
          item.location || "-",
          `${item.recordingDuration || 0} seconds`,
          item.conditionType || "N/A",
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          fontSize: 8,
          cellPadding: 2,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 3, right: 3, top: 25 },
        styles: {
          fontSize: 7,
          cellPadding: 1,
          overflow: "linebreak",
          halign: "center",
          valign: "middle",
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { cellWidth: 20 }, // Date & Time
          1: { cellWidth: 14 }, // UHID
          2: { cellWidth: 20 }, // Patient Name
          3: { cellWidth: 16 }, // Department
          4: { cellWidth: 16 }, // Doctor
          5: { cellWidth: 16 }, // Attender
          6: { cellWidth: 16 }, // ICU Consultant
          7: { cellWidth: 14 }, // Location
          8: { cellWidth: 14 }, // Duration
          9: { cellWidth: 12 }, // Condition
        },
        tableWidth: "wrap",
        horizontalPageBreak: false,
        showHead: "firstPage",
        didDrawPage: function (data) {
          // Header
          doc.setFontSize(8);
          doc.text(
            "Page " + doc.internal.getNumberOfPages(),
            data.settings.margin.left,
            8
          );
        },
      });

      // Save the PDF with timestamp
      const fileName = `Consultation_Report_${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  const exportToExcel = () => {
    // Add timestamp to filename
    const now = new Date();
    const fileName = `Consultation_Report_${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}.xlsx`;
    
    const worksheet = XLSX.utils.json_to_sheet(
      consultations.map((item) => ({
        "Date & Time": new Date(item.date).toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }),
        "UHID": item.uhidId || "-",
        "Patient Name": item.patientName || "-",
        "Department": item.department || "-",
        "Doctor": item.doctorName || "-",
        "Attender": item.attenderName || "-",
        "ICU Consultant": item.icuConsultantName || "-",
        "Location": item.location || "-",
        "Duration": `${item.recordingDuration || 0} seconds`,
        "Condition": item.conditionType || "N/A",
      }))
    );

    // Set column widths for better readability
    const columnWidths = [
      { wch: 20 }, // Date & Time
      { wch: 12 }, // UHID
      { wch: 20 }, // Patient Name
      { wch: 15 }, // Department
      { wch: 15 }, // Doctor
      { wch: 15 }, // Attender
      { wch: 15 }, // ICU Consultant
      { wch: 12 }, // Location
      { wch: 12 }, // Duration
      { wch: 10 }, // Condition
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Consultations");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(data, fileName);
  };

  // Function to format date to DD-MM-YYYY
  const formatDateToFolder = (dateString) => {
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Function to generate filename from consultation data using MongoDB _id
  const generateFilename = (consultation) => {
    if (!consultation._id) {
      return null;
    }
    return `${consultation._id}.webm`;
  };

  // ✅ Helper function to construct video URLs consistently
  const constructVideoUrl = (date, filename) => {
    return `${api.defaults.baseURL}/videos/${date}/${filename}`;
  };

  // Function to check if video exists on NAS
  const checkVideoExists = async (date, filename) => {
    try {
      // ✅ Use relative URL with API instance
      const response = await api.head(`/videos/${date}/${filename}`, {
        validateStatus: (status) => status < 500, // prevent throwing for 404/400
      });

      console.log("HEAD check status:", response.status);
      // Accept both 200 and 206 (Partial Content) as valid responses
      return response.status === 200 || response.status === 206;
    } catch (error) {
      console.error("Error checking video:", error);
      return false;
    }
  };

  // Function to handle clicking on a consultation and loading the video
  const handleVideoClick = async (consultation) => {
    try {
      setVideoError("");
      setCurrentVideoPath("");
      setVideoLoading(true);
      setShowVideoModal(true);

      if (!consultation._id || !consultation.date) {
        setVideoError("Consultation ID or date missing");
        setVideoLoading(false);
        return;
      }

      // ✅ Generate date folder and filename using MongoDB _id
      const videoDate = formatDateToFolder(consultation.date);
      const filename = generateFilename(consultation);

      if (!filename) {
        setVideoError("Unable to generate filename from consultation data");
        setVideoLoading(false);
        return;
      }

      console.log("Date folder:", videoDate);
      console.log("Filename:", filename);

      // ✅ Check if the video exists before playback
      const videoExists = await checkVideoExists(videoDate, filename);
      if (!videoExists) {
        setVideoError(`Video file not found: ${filename}`);
        setVideoLoading(false);
        return;
      }

      // ✅ Fetch video as blob to avoid range request issues
      console.log("Fetching video as blob...");
      const response = await api.get(`/videos/${videoDate}/${filename}`, {
        responseType: "blob",
      });

      if (response.status === 200) {
        // ✅ Create object URL from blob
        const blob = new Blob([response.data], { type: "video/webm" });
        const objectUrl = URL.createObjectURL(blob);

        console.log("✅ Video blob created, object URL:", objectUrl);

        // ✅ Set the object URL for video playback
        setCurrentVideoPath(objectUrl);
        setVideoLoading(false);
      } else {
        throw new Error("Failed to fetch video blob");
      }
    } catch (error) {
      console.error("Error playing video:", error);
      setVideoError("Error accessing video file");
      setVideoLoading(false);
    }
  };

  // ✅ Function to handle video loading with proper range request support
  const handleVideoLoad = () => {
    if (videoRef.current) {
      // Set up video element for better streaming
      videoRef.current.preload = "metadata";
      videoRef.current.crossOrigin = "anonymous";

      // Remove any existing event listeners to prevent duplicates
      videoRef.current.removeEventListener("error", handleVideoError);
      videoRef.current.removeEventListener("canplay", handleVideoCanPlay);
      videoRef.current.removeEventListener(
        "loadedmetadata",
        handleVideoLoadedMetadata
      );
      videoRef.current.removeEventListener("loadstart", handleVideoLoadStart);
      videoRef.current.removeEventListener("progress", handleVideoProgress);
      videoRef.current.removeEventListener("suspend", handleVideoSuspend);

      // Add event listeners for better error handling and loading states
      videoRef.current.addEventListener("error", handleVideoError);
      videoRef.current.addEventListener("canplay", handleVideoCanPlay);
      videoRef.current.addEventListener(
        "loadedmetadata",
        handleVideoLoadedMetadata
      );
      videoRef.current.addEventListener("loadstart", handleVideoLoadStart);
      videoRef.current.addEventListener("progress", handleVideoProgress);
      videoRef.current.addEventListener("suspend", handleVideoSuspend);
    }
  };

  // ✅ Separate event handler functions to prevent memory leaks
  const handleVideoError = (e) => {
    console.error("Video loading error:", e);
    // Don't show error for 206 Partial Content as it's normal for streaming
    if (e.target.error && e.target.error.code === 4) {
      console.log(
        "Video stream interrupted - this is normal for range requests"
      );
      return;
    }
    setVideoError(
      "Video failed to load. Please try again or download the file."
    );
  };

  const handleVideoCanPlay = () => {
    console.log("Video can play - loading complete");
    setVideoLoading(false);
  };

  const handleVideoLoadedMetadata = () => {
    console.log("Video metadata loaded");
    setVideoLoading(false);
  };

  const handleVideoLoadStart = () => {
    console.log("Video loading started");
    setVideoLoading(true);
  };

  const handleVideoProgress = () => {
    console.log("Video loading progress");
    // Keep loading state true while progress is happening
    setVideoLoading(true);
  };

  const handleVideoSuspend = () => {
    console.log("Video loading suspended");
    // Don't set loading to false on suspend as it might resume
  };

  // ✅ Function to handle modal closing with cleanup
  const handleModalClose = () => {
    // Clean up object URL when modal is closed
    if (currentVideoPath && currentVideoPath.startsWith("blob:")) {
      URL.revokeObjectURL(currentVideoPath);
    }
    setCurrentVideoPath("");
    setShowVideoModal(false);
  };

  const handleEditClick = (consultation) => {
    setEditConsultation(consultation);
    setEditForm({
      patientName: consultation.patientName || "",
      doctorName: consultation.doctorName || "",
      uhidId: consultation.uhidId || "",
      attenderName: consultation.attenderName || "",
      icuConsultantName: consultation.icuConsultantName || "",
      department: consultation.department || "",
      conditionType: consultation.conditionType || "",
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  // Fetch doctors for edit modal
  const fetchEditDoctors = async () => {
    if (!editDoctorsLoaded && !editMastersLoading) {
      setEditMastersLoading(true);
      setEditMastersError("");
      
      try {
        const doctorsResponse = await api.get('/masters/doctors');
        setEditDoctors(doctorsResponse.data);
        setEditDoctorsLoaded(true);
      } catch (error) {
        console.error('Error fetching doctors for edit:', error);
        setEditMastersError('Failed to load doctors');
      } finally {
        setEditMastersLoading(false);
      }
    }
  };

  // Fetch ICU consultants for edit modal
  const fetchEditIcuConsultants = async () => {
    if (!editIcuConsultantsLoaded && !editMastersLoading) {
      setEditMastersLoading(true);
      setEditMastersError("");
      
      try {
        const icuResponse = await api.get('/masters/icu-consultants');
        setEditIcuConsultants(icuResponse.data);
        setEditIcuConsultantsLoaded(true);
      } catch (error) {
        console.error('Error fetching ICU consultants for edit:', error);
        setEditMastersError('Failed to load ICU consultants');
      } finally {
        setEditMastersLoading(false);
      }
    }
  };



  const handleEditSave = async () => {
    try {
      setLoading(true);
      setError("");

      // ✅ Use the configured API instance instead of hardcoded URL
      await api.put(`/consultations/${editConsultation._id}`, editForm);

      setShowEditModal(false);
      fetchConsultations(); // Refresh the table
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Session expired or unauthorized. Please login again.");
        // Optionally, redirect to login page here if you want:
        // navigate('/doctor-login');
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to update consultation"
        );
      }
    } finally {
      setLoading(false);
    }
  };

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

      {/* Floating Elements */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: "100px",
          height: "100px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "50%",
          animation: "float 6s ease-in-out infinite",
        }}
      ></div>
      <div
        style={{
          position: "absolute",
          top: "20%",
          right: "10%",
          width: "150px",
          height: "150px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "50%",
          animation: "float 8s ease-in-out infinite reverse",
        }}
      ></div>
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          left: "15%",
          width: "80px",
          height: "80px",
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: "50%",
          animation: "float 7s ease-in-out infinite",
        }}
      ></div>

      <Container fluid className="p-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            className="shadow-lg border-0"
            style={{
              borderRadius: "0",
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
              minHeight: "100vh",
              position: "relative",
              zIndex: 1,
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
                <div className="d-flex gap-3">
                  <Button
                    variant="outline-primary"
                    className="shadow-sm"
                    onClick={exportToPDF}
                    disabled={loading || consultations.length === 0}
                    style={{
                      borderWidth: "2px",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontWeight: "500",
                      fontSize: "0.9rem",
                      height: "40px",
                      minWidth: "110px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FaFilePdf className="me-2" style={{ fontSize: "0.8rem" }} />
                    Export PDF
                  </Button>
                  <Button
                    variant="outline-success"
                    className="shadow-sm"
                    onClick={exportToExcel}
                    disabled={loading || consultations.length === 0}
                    style={{
                      borderWidth: "2px",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontWeight: "500",
                      fontSize: "0.9rem",
                      height: "40px",
                      minWidth: "110px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FaFileExcel className="me-2" style={{ fontSize: "0.8rem" }} />
                    Export Excel
                  </Button>
                </div>
              </div>

              <h3
                className="mb-4 text-center"
                style={{
                  color: "#2d3748",
                  fontWeight: "600",
                  fontSize: "2rem",
                }}
              >
                Consultation Reports
              </h3>

              {error && (
                <Alert
                  variant="danger"
                  className="mb-4"
                  style={{ borderRadius: "10px" }}
                >
                  {error}
                </Alert>
              )}

              <Card
                className="mb-4"
                style={{
                  borderRadius: "15px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
                }}
              >
                <Card.Body className="p-4">
                  <h5
                    className="mb-3"
                    style={{ color: "#4a5568", fontWeight: "600" }}
                  >
                    <FaFilter className="me-2" />
                    Filters
                  </h5>
                  <div className="d-flex flex-wrap gap-3 mb-3" style={{ overflowX: "auto" }}>
                    <div style={{ minWidth: "160px", flex: "1 1 auto" }}>
                      <Form.Group className="mb-0">
                        <Form.Label
                          style={{ fontWeight: "500", color: "#4a5568", fontSize: "0.9rem" }}
                        >
                          Date From
                        </Form.Label>
                        <Form.Control
                          type="date"
                          name="dateFrom"
                          value={filters.dateFrom}
                          onChange={handleFilterChange}
                          style={{
                            borderRadius: "8px",
                            border: "2px solid #e2e8f0",
                            fontSize: "0.9rem",
                            padding: "8px 12px",
                          }}
                        />
                      </Form.Group>
                    </div>
                    <div style={{ minWidth: "160px", flex: "1 1 auto" }}>
                      <Form.Group className="mb-0">
                        <Form.Label
                          style={{ fontWeight: "500", color: "#4a5568", fontSize: "0.9rem" }}
                        >
                          Date To
                        </Form.Label>
                        <Form.Control
                          type="date"
                          name="dateTo"
                          value={filters.dateTo}
                          onChange={handleFilterChange}
                          style={{
                            borderRadius: "8px",
                            border: "2px solid #e2e8f0",
                            fontSize: "0.9rem",
                            padding: "8px 12px",
                          }}
                        />
                      </Form.Group>
                    </div>
                    <div style={{ minWidth: "160px", flex: "1 1 auto" }}>
                      <Form.Group className="mb-0">
                        <Form.Label
                          style={{ fontWeight: "500", color: "#4a5568", fontSize: "0.9rem" }}
                        >
                          Patient Name
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="patientName"
                          value={filters.patientName}
                          onChange={handleFilterChange}
                          placeholder="Search patient"
                          style={{
                            borderRadius: "8px",
                            border: "2px solid #e2e8f0",
                            fontSize: "0.9rem",
                            padding: "8px 12px",
                          }}
                        />
                      </Form.Group>
                    </div>
                    <div style={{ minWidth: "160px", flex: "1 1 auto" }}>
                      <Form.Group className="mb-0">
                        <Form.Label
                          style={{ fontWeight: "500", color: "#4a5568", fontSize: "0.9rem" }}
                        >
                          Doctor Name
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="doctorName"
                          value={filters.doctorName}
                          onChange={handleFilterChange}
                          placeholder="Search doctor"
                          style={{
                            borderRadius: "8px",
                            border: "2px solid #e2e8f0",
                            fontSize: "0.9rem",
                            padding: "8px 12px",
                          }}
                        />
                      </Form.Group>
                    </div>
                    <div style={{ minWidth: "160px", flex: "1 1 auto" }}>
                      <Form.Group className="mb-0">
                        <Form.Label
                          style={{ fontWeight: "500", color: "#4a5568", fontSize: "0.9rem" }}
                        >
                          UHID
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="uhidId"
                          value={filters.uhidId}
                          onChange={handleFilterChange}
                          placeholder="Search UHID"
                          style={{
                            borderRadius: "8px",
                            border: "2px solid #e2e8f0",
                            fontSize: "0.9rem",
                            padding: "8px 12px",
                          }}
                        />
                      </Form.Group>
                    </div>
                    <div style={{ minWidth: "160px", flex: "1 1 auto" }}>
                      <Form.Group className="mb-0">
                        <Form.Label
                          style={{ fontWeight: "500", color: "#4a5568", fontSize: "0.9rem" }}
                        >
                          Department
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="department"
                          value={filters.department}
                          onChange={handleFilterChange}
                          placeholder="Search department"
                          style={{
                            borderRadius: "8px",
                            border: "2px solid #e2e8f0",
                            fontSize: "0.9rem",
                            padding: "8px 12px",
                          }}
                        />
                      </Form.Group>
                    </div>
                    <div style={{ minWidth: "160px", flex: "1 1 auto" }}>
                      <Form.Group className="mb-0">
                        <Form.Label
                          style={{ fontWeight: "500", color: "#4a5568", fontSize: "0.9rem" }}
                        >
                          📍 Location
                        </Form.Label>
                        <Form.Select
                          name="location"
                          value={filters.location}
                          onChange={handleFilterChange}
                          style={{
                            borderRadius: "8px",
                            border: "2px solid #e2e8f0",
                            fontSize: "0.9rem",
                            padding: "8px 12px",
                          }}
                        >
                          <option value="">All Locations</option>
                          {getUniqueLocations().map((location) => (
                            <option key={location} value={location}>
                               {location}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </div>
                    <div style={{ minWidth: "160px", flex: "1 1 auto" }}>
                      <Form.Group className="mb-0">
                        <Form.Label
                          style={{ fontWeight: "500", color: "#4a5568", fontSize: "0.9rem" }}
                        >
                          🛏️ Condition
                        </Form.Label>
                        <Form.Select
                          name="conditionType"
                          value={filters.conditionType}
                          onChange={handleFilterChange}
                          style={{
                            borderRadius: "8px",
                            border: "2px solid #e2e8f0",
                            fontSize: "0.9rem",
                            padding: "8px 12px",
                          }}
                        >
                          <option value="">All Conditions</option>
                          <option value="normal">🟢 Normal</option>
                          <option value="CriticalCare">⚠️ CriticalCare</option>
                          <option value="MLC">🚨 MLC</option>
                        </Form.Select>
                      </Form.Group>
                    </div>
                  </div>
                  <Row>
                    <Col md={12}>
                      <div className="d-flex justify-content-end gap-3">
                        <Button
                          variant="outline-secondary"
                          onClick={clearFilters}
                          disabled={loading}
                          style={{
                            borderRadius: "8px",
                            padding: "8px 12px",
                            fontWeight: "500",
                            border: "2px solid #6c757d",
                            minWidth: "120px",
                            fontSize: "0.9rem",
                            height: "auto",
                            lineHeight: "1.2",
                          }}
                        >
                          Clear Filters
                        </Button>
                        <Button
                          variant="primary"
                          onClick={applyFilters}
                          disabled={loading}
                          style={{
                            borderRadius: "8px",
                            padding: "8px 12px",
                            fontWeight: "500",
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            border: "none",
                            minWidth: "150px",
                            fontSize: "0.9rem",
                            height: "auto",
                            lineHeight: "1.2",
                          }}
                        >
                          {loading ? (
                            <>
                              <Spinner
                                animation="border"
                                size="sm"
                                className="me-2"
                              />
                              Loading...
                            </>
                          ) : (
                            <>
                              <FaFilter className="me-2" />
                              Apply Filters
                            </>
                          )}
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" size="lg" />
                  <p className="mt-3" style={{ color: "#4a5568" }}>
                    Loading consultations...
                  </p>
                </div>
              ) : consultations.length === 0 ? (
                <Alert variant="info" style={{ borderRadius: "10px" }}>
                  <div className="d-flex align-items-center">
                    <FaFilter className="me-2" />
                    <div>
                      <strong>
                        {allConsultations.length === 0
                          ? "No consultations found."
                          : `No records on page ${currentPage}.`}
                      </strong>
                      {allConsultations.length === 0
                        ? " Try adjusting your filters or search criteria."
                        : " Navigate to another page or adjust page size."}
                      <br />
                      <small className="text-muted">
                        {allConsultations.length === 0
                          ? "You can filter by date range, patient name, doctor name, UHID, or department."
                          : `Total records: ${allConsultations.length}`}
                      </small>
                    </div>
                  </div>
                </Alert>
              ) : (
                <div
                  className="table-responsive"
                  style={{
                    overflowX: "auto",
                    borderRadius: "15px",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                    border: "1px solid #e2e8f0",
                    minWidth: "100%",
                    scrollbarWidth: "thin",
                    scrollbarColor: "#cbd5e0 #f7fafc",
                    position: "relative",
                  }}
                >
                  <div
                    className="d-flex justify-content-between align-items-center mb-4"
                    style={{
                      minWidth: "1520px",
                      padding: "0 15px",
                    }}
                  >
                    <div className="d-flex align-items-center gap-4">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          style={{
                            color: "#2d3748",
                            fontWeight: "600",
                            fontSize: "0.95rem",
                          }}
                        >
                          📊 Records:
                        </span>
                        {/* <small className="text-muted" style={{ 
                          fontSize: '0.75rem',
                          backgroundColor: '#fef3c7',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid #f59e0b'
                        }}>
                          🕒 Most Recent First
                        </small> */}
                        <span
                          style={{
                            color: "#4a5568",
                            fontWeight: "500",
                            fontSize: "0.9rem",
                            backgroundColor: "#f7fafc",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          {totalItems > 0 ? (
                            <>
                              Showing{" "}
                              <strong>
                                {(currentPage - 1) * itemsPerPage + 1}–
                                {Math.min(
                                  currentPage * itemsPerPage,
                                  totalItems
                                )}
                              </strong>{" "}
                              of <strong>{totalItems}</strong> records
                              {totalItems > itemsPerPage && (
                                <span
                                  style={{
                                    color: "#6b7280",
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  {" "}
                                  (Page {currentPage} of{" "}
                                  {Math.ceil(totalItems / itemsPerPage)})
                                </span>
                              )}
                            </>
                          ) : (
                            "No records found"
                          )}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          style={{
                            color: "#2d3748",
                            fontWeight: "600",
                            fontSize: "0.95rem",
                          }}
                        >
                          📄 Per Page:
                        </span>
                        <Form.Select
                          value={itemsPerPage}
                          onChange={handleItemsPerPageChange}
                          className="shadow-sm"
                          style={{
                            width: "auto",
                            borderRadius: "8px",
                            border: "2px solid #e2e8f0",
                            padding: "6px 10px",
                            fontSize: "0.9rem",
                            minWidth: "80px",
                          }}
                        >
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                        </Form.Select>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <small
                        className="text-muted"
                        style={{
                          fontSize: "0.8rem",
                          backgroundColor: "#f0f9ff",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid #bae6fd",
                        }}
                      >
                        💡 Scroll horizontally • 🕒 Most recent first
                      </small>
                    </div>
                  </div>

                  <Table
                    className="table table-hover mb-0"
                    style={{
                      minWidth: "1520px",
                      width: "100%",
                      marginBottom: "0",
                      tableLayout: "fixed",
                      borderCollapse: "separate",
                      borderSpacing: "0",
                    }}
                  >
                    <thead
                      style={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                      }}
                    >
                      <tr>
                        <th
                          onClick={() => handleSort("date")}
                          style={{
                            cursor: "pointer",
                            padding: "15px",
                            border: "none",
                            width: "140px",
                            minWidth: "140px",
                          }}
                        >
                          📅 Date & Time ↓
                        </th>
                        <th
                          onClick={() => handleSort("uhidId")}
                          style={{
                            cursor: "pointer",
                            padding: "15px",
                            border: "none",
                            width: "120px",
                            minWidth: "120px",
                          }}
                        >
                          🆔 UHID{" "}
                          {sortConfig.field === "uhidId" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          onClick={() => handleSort("patientName")}
                          style={{
                            cursor: "pointer",
                            padding: "15px",
                            border: "none",
                            width: "180px",
                            minWidth: "180px",
                          }}
                        >
                          👤 Patient Name{" "}
                          {sortConfig.field === "patientName" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          onClick={() => handleSort("department")}
                          style={{
                            cursor: "pointer",
                            padding: "15px",
                            border: "none",
                            width: "160px",
                            minWidth: "160px",
                          }}
                        >
                          🏢 Department{" "}
                          {sortConfig.field === "department" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          onClick={() => handleSort("doctorName")}
                          style={{
                            cursor: "pointer",
                            padding: "15px",
                            border: "none",
                            width: "160px",
                            minWidth: "160px",
                          }}
                        >
                          👨‍⚕️ Doctor{" "}
                          {sortConfig.field === "doctorName" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          style={{
                            padding: "15px",
                            border: "none",
                            width: "140px",
                            minWidth: "140px",
                          }}
                        >
                          👥 Attender
                        </th>
                        <th
                          style={{
                            padding: "15px",
                            border: "none",
                            width: "160px",
                            minWidth: "160px",
                          }}
                        >
                          ⚕️ ICU Consultant
                        </th>
                        <th
                          onClick={() => handleSort("location")}
                          style={{
                            cursor: "pointer",
                            padding: "15px",
                            border: "none",
                            width: "120px",
                            minWidth: "120px",
                          }}
                        >
                          📍 Location{" "}
                          {sortConfig.field === "location" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          onClick={() => handleSort("recordingDuration")}
                          style={{
                            cursor: "pointer",
                            padding: "15px",
                            border: "none",
                            width: "120px",
                            minWidth: "120px",
                          }}
                        >
                          ⏱ Duration{" "}
                          {sortConfig.field === "recordingDuration" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </th>

                        <th
                          onClick={() => handleSort("conditionType")}
                          style={{
                            cursor: "pointer",
                            padding: "15px",
                            border: "none",
                            width: "120px",
                            minWidth: "120px",
                          }}
                        >
                          🛏️ Condition{" "}
                          {sortConfig.field === "conditionType" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </th>

                        <th
                          style={{
                            padding: "15px",
                            border: "none",
                            textAlign: "center",
                            width: "140px",
                            minWidth: "140px",
                          }}
                        >
                          ⚡ Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultations.map((consultation, index) => (
                        <tr
                          key={consultation._id}
                          style={{
                            background: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                            borderBottom: "1px solid #e2e8f0",
                          }}
                        >
                          <td
                            style={{
                              padding: "15px",
                              verticalAlign: "middle",
                              width: "140px",
                              minWidth: "140px",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "600",
                                color: "#2d3748",
                                fontSize: "0.9rem",
                              }}
                            >
                              {new Date(consultation.date).toLocaleDateString()}
                            </div>
                            <small
                              className="text-muted"
                              style={{ fontSize: "0.8rem" }}
                            >
                              {new Date(consultation.date).toLocaleTimeString()}
                            </small>
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              verticalAlign: "middle",
                              width: "120px",
                              minWidth: "120px",
                            }}
                          >
                            <span
                              className="badge"
                              style={{
                                background:
                                  "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                                color: "white",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {consultation.uhidId}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              verticalAlign: "middle",
                              width: "180px",
                              minWidth: "180px",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "500",
                                color: "#2d3748",
                                fontSize: "0.9rem",
                                wordBreak: "break-word",
                              }}
                            >
                              {consultation.patientName}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              verticalAlign: "middle",
                              width: "160px",
                              minWidth: "160px",
                            }}
                          >
                            <div
                              style={{
                                color: "#4a5568",
                                fontSize: "0.9rem",
                                wordBreak: "break-word",
                              }}
                            >
                              {consultation.department || "-"}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              verticalAlign: "middle",
                              width: "160px",
                              minWidth: "160px",
                            }}
                          >
                            <div
                              style={{
                                color: "#4a5568",
                                fontSize: "0.9rem",
                                wordBreak: "break-word",
                              }}
                            >
                              {consultation.doctorName}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              verticalAlign: "middle",
                              width: "140px",
                              minWidth: "140px",
                            }}
                          >
                            <div
                              style={{
                                color: "#4a5568",
                                fontSize: "0.9rem",
                                wordBreak: "break-word",
                              }}
                            >
                              {consultation.attenderName || "-"}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              verticalAlign: "middle",
                              width: "160px",
                              minWidth: "160px",
                            }}
                          >
                            <div
                              style={{
                                color: "#4a5568",
                                fontSize: "0.9rem",
                                wordBreak: "break-word",
                              }}
                            >
                              {consultation.icuConsultantName || "-"}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              verticalAlign: "middle",
                              width: "120px",
                              minWidth: "120px",
                            }}
                          >
                            <span
                              className="badge"
                              style={{
                                background:
                                  "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                                color: "white",
                                padding: "6px 10px",
                                                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                whiteSpace: "normal",
                                wordWrap: "break-word",
                                wordBreak: "break-word",
                                textAlign: "center",
                                display: "inline-block",
                                lineHeight: "1.2",
                                maxWidth: "100%",
                              }}
                            >
                              📍 {consultation.location || "N/A"}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "15px",
                              verticalAlign: "middle",
                              width: "120px",
                              minWidth: "120px",
                            }}
                          >
                            <span
                              className="badge"
                              style={{
                                background:
                                  "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                                color: "white",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              ⏱ {consultation.recordingDuration}s
                            </span>
                          </td>

                          <td
                            style={{
                              padding: "15px",
                              verticalAlign: "middle",
                              width: "120px",
                              minWidth: "120px",
                            }}
                          >
                            <span
                              className={`badge ${
                                consultation.conditionType === "normal"
                                  ? "bg-success"
                                  : consultation.conditionType === "CriticalCare"
                                  ? "bg-warning"
                                  : consultation.conditionType === "MLC"
                                  ? "bg-danger"
                                  : "bg-secondary"
                              }`}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                whiteSpace: "nowrap",
                                background:
                                  consultation.conditionType === "normal"
                                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                                    : consultation.conditionType === "CriticalCare"
                                    ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                                    : consultation.conditionType === "MLC"
                                    ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                                    : "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                                color: "white",
                              }}
                            >
                              {consultation.conditionType
                                ? consultation.conditionType.charAt(0).toUpperCase() +
                                  consultation.conditionType.slice(1)
                                : "N/A"}
                            </span>
                          </td>

                          <td
                            style={{
                              padding: "15px",
                              verticalAlign: "middle",
                              textAlign: "center",
                              width: "140px",
                              minWidth: "140px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              className="d-flex gap-1 justify-content-center"
                              style={{ flexWrap: "nowrap" }}
                            >
                              <Button
                                variant="success"
                                size="sm"
                                className="rounded-pill d-flex align-items-center gap-1"
                                onClick={() => handleVideoClick(consultation)}
                                title="Play Video"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                  border: "none",
                                  boxShadow:
                                    "0 2px 8px rgba(16, 185, 129, 0.3)",
                                  padding: "6px 10px",
                                  fontSize: "0.75rem",
                                  minWidth: "60px",
                                  maxWidth: "65px",
                                }}
                              >
                                <FaPlay style={{ fontSize: "0.7rem" }} />
                                <span style={{ fontSize: "0.7rem" }}>Play</span>
                              </Button>
                              <Button
                                variant="info"
                                size="sm"
                                className="rounded-pill d-flex align-items-center gap-1"
                                onClick={() => handleEditClick(consultation)}
                                title="Edit Patient"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                                  border: "none",
                                  boxShadow:
                                    "0 2px 8px rgba(59, 130, 246, 0.3)",
                                  padding: "6px 10px",
                                  fontSize: "0.75rem",
                                  minWidth: "60px",
                                  maxWidth: "65px",
                                }}
                              >
                                <FaEdit style={{ fontSize: "0.7rem" }} />
                                <span style={{ fontSize: "0.7rem" }}>Edit</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {/* Enhanced Pagination */}
                  <div
                    className="d-flex justify-content-between align-items-center mt-4"
                    style={{
                      minWidth: "1520px",
                      padding: "0 15px",
                    }}
                  >
                    <div style={{ color: "#4a5568", fontWeight: "500" }}>
                      Page {currentPage} of{" "}
                      {Math.ceil(totalItems / itemsPerPage)}
                    </div>
                    <Pagination className="mb-0" style={{ gap: "5px" }}>
                      <Pagination.First
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        style={{
                          borderRadius: "10px",
                          margin: "0 2px",
                          padding: "10px 15px",
                          border: "2px solid #e2e8f0",
                          backgroundColor:
                            currentPage === 1 ? "#f1f5f9" : "#ffffff",
                          color: currentPage === 1 ? "#94a3b8" : "#374151",
                          fontWeight: "500",
                        }}
                      >
                        ««
                      </Pagination.First>
                      <Pagination.Prev
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{
                          borderRadius: "10px",
                          margin: "0 2px",
                          padding: "10px 15px",
                          border: "2px solid #e2e8f0",
                          backgroundColor:
                            currentPage === 1 ? "#f1f5f9" : "#ffffff",
                          color: currentPage === 1 ? "#94a3b8" : "#374151",
                          fontWeight: "500",
                        }}
                      >
                        « Previous
                      </Pagination.Prev>

                      {/* Show limited page numbers */}
                      {(() => {
                        const totalPages = Math.ceil(totalItems / itemsPerPage);
                        const maxVisiblePages = 5;
                        let startPage = Math.max(
                          1,
                          currentPage - Math.floor(maxVisiblePages / 2)
                        );
                        let endPage = Math.min(
                          totalPages,
                          startPage + maxVisiblePages - 1
                        );

                        // Adjust start page if we're near the end
                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(
                            1,
                            endPage - maxVisiblePages + 1
                          );
                        }

                        const pages = [];
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(i);
                        }

                        return pages.map((pageNum) => (
                          <Pagination.Item
                            key={pageNum}
                            active={pageNum === currentPage}
                            onClick={() => handlePageChange(pageNum)}
                            style={{
                              margin: "0 2px",
                              borderRadius: "10px",
                              border: "2px solid #e2e8f0",
                              padding: "10px 15px",
                              backgroundColor:
                                pageNum === currentPage
                                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                  : "#ffffff",
                              color:
                                pageNum === currentPage ? "#ffffff" : "#374151",
                              fontWeight: "500",
                              minWidth: "45px",
                              textAlign: "center",
                            }}
                          >
                            {pageNum}
                          </Pagination.Item>
                        ));
                      })()}

                      <Pagination.Next
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={
                          currentPage === Math.ceil(totalItems / itemsPerPage)
                        }
                        style={{
                          borderRadius: "10px",
                          margin: "0 2px",
                          padding: "10px 15px",
                          border: "2px solid #e2e8f0",
                          backgroundColor:
                            currentPage === Math.ceil(totalItems / itemsPerPage)
                              ? "#f1f5f9"
                              : "#ffffff",
                          color:
                            currentPage === Math.ceil(totalItems / itemsPerPage)
                              ? "#94a3b8"
                              : "#374151",
                          fontWeight: "500",
                        }}
                      >
                        Next »
                      </Pagination.Next>
                      <Pagination.Last
                        onClick={() =>
                          handlePageChange(Math.ceil(totalItems / itemsPerPage))
                        }
                        disabled={
                          currentPage === Math.ceil(totalItems / itemsPerPage)
                        }
                        style={{
                          borderRadius: "10px",
                          margin: "0 2px",
                          padding: "10px 15px",
                          border: "2px solid #e2e8f0",
                          backgroundColor:
                            currentPage === Math.ceil(totalItems / itemsPerPage)
                              ? "#f1f5f9"
                              : "#ffffff",
                          color:
                            currentPage === Math.ceil(totalItems / itemsPerPage)
                              ? "#94a3b8"
                              : "#374151",
                          fontWeight: "500",
                        }}
                      >
                        »»
                      </Pagination.Last>
                    </Pagination>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </motion.div>

        <Modal
          show={showVideoModal}
          onHide={() => {
            // Clean up object URL when modal is closed
            if (currentVideoPath && currentVideoPath.startsWith("blob:")) {
              URL.revokeObjectURL(currentVideoPath);
            }
            setCurrentVideoPath("");
            setShowVideoModal(false);
          }}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Consultation Video</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {videoLoading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading video...</p>
              </div>
            ) : videoError ? (
              <Alert variant="danger">{videoError}</Alert>
            ) : currentVideoPath ? (
              <div className="text-center">
                <video
                  src={currentVideoPath}
                  controls
                  width="100%"
                  preload="metadata"
                  style={{ borderRadius: "10px" }}
                  onError={(e) => console.error("Video load error", e)}
                  onLoadedData={() => console.log("Video loaded")}
                >
                  {/* Fallback for browsers that don't support video */}
                  <p>Your browser does not support the video tag.</p>
                  <a
                    href={currentVideoPath}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Click here to download the video
                  </a>
                </video>
              </div>
            ) : (
              <div className="text-center py-5">
                <p className="text-muted">No video available</p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>
              Close
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => window.open(currentVideoPath, "_blank")}
              disabled={!currentVideoPath}
            >
              Open in New Tab
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Patient Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {editMastersError && (
              <Alert variant="warning" className="mb-3">
                <FaCog className="me-2" />
                {editMastersError}
              </Alert>
            )}
            <Form>
              {/* 1. UHID - Read Only */}
              <Form.Group className="mb-3">
                <Form.Label>
                   UHID <small className="text-muted">(Read Only)</small>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="uhidId"
                  value={editForm.uhidId}
                  readOnly
                  style={{
                    backgroundColor: "#f8f9fa",
                    border: "2px solid #e9ecef",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    padding: "8px 12px",
                  }}
                />
              </Form.Group>

              {/* 2. Patient Name - Read Only */}
              <Form.Group className="mb-3">
                <Form.Label>
                   Patient Name <small className="text-muted">(Read Only)</small>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="patientName"
                  value={editForm.patientName}
                  readOnly
                  style={{
                    backgroundColor: "#f8f9fa",
                    border: "2px solid #e9ecef",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    padding: "8px 12px",
                  }}
                />
              </Form.Group>

              {/* 3. Department */}
              <Form.Group className="mb-3">
                <Form.Label>Department</Form.Label>
                <Form.Control
                  type="text"
                  name="department"
                  value={editForm.department}
                  onChange={handleEditFormChange}
                  placeholder="Enter department"
                  style={{
                    borderRadius: "8px",
                    border: "2px solid #e2e8f0",
                    fontSize: "0.9rem",
                    padding: "8px 12px",
                  }}
                />
              </Form.Group>

              {/* 4. Attender Name */}
              <Form.Group className="mb-3">
                <Form.Label>Attender Name</Form.Label>
                <Form.Control
                  type="text"
                  name="attenderName"
                  value={editForm.attenderName}
                  onChange={handleEditFormChange}
                  placeholder="Enter attender name"
                  style={{
                    borderRadius: "8px",
                    border: "2px solid #e2e8f0",
                    fontSize: "0.9rem",
                    padding: "8px 12px",
                  }}
                />
              </Form.Group>

              {/* 5. Doctor Name */}
              <Form.Group className="mb-3">
                <Form.Label>Doctor Name</Form.Label>
                <MultiSelect
                  options={editDoctors.map(doctor => ({
                    value: doctor._id,
                    label: doctor.name
                  }))}
                  value={editForm.doctorName ? [{
                    value: editForm.doctorName,
                    label: editForm.doctorName
                  }] : []}
                  onChange={(selected) => {
                    setEditForm({
                      ...editForm,
                      doctorName: selected.length > 0 ? selected[0].label : ""
                    });
                  }}
                  placeholder="Select doctor..."
                  disabled={editMastersLoading}
                  loading={editMastersLoading}
                  icon={FaUserMd}
                  onFirstClick={fetchEditDoctors}
                />
              </Form.Group>

              {/* 6. ICU Consultant */}
              <Form.Group className="mb-3">
                <Form.Label>ICU Consultant</Form.Label>
                <MultiSelect
                  options={editIcuConsultants.map(consultant => ({
                    value: consultant._id,
                    label: consultant.name
                  }))}
                  value={editForm.icuConsultantName ? [{
                    value: editForm.icuConsultantName,
                    label: editForm.icuConsultantName
                  }] : []}
                  onChange={(selected) => {
                    setEditForm({
                      ...editForm,
                      icuConsultantName: selected.length > 0 ? selected[0].label : ""
                    });
                  }}
                  placeholder="Select ICU consultant..."
                  disabled={editMastersLoading}
                  loading={editMastersLoading}
                  icon={FaUserMd}
                  onFirstClick={fetchEditIcuConsultants}
                />
              </Form.Group>

              {/* 7. Condition Type */}
              <Form.Group className="mb-3">
                <Form.Label> Condition Type</Form.Label>
                <Form.Select
                  name="conditionType"
                  value={editForm.conditionType}
                  onChange={handleEditFormChange}
                  style={{
                    borderRadius: "8px",
                    border: "2px solid #e2e8f0",
                    fontSize: "0.9rem",
                    padding: "8px 12px",
                  }}
                >
                  <option value="">Select Condition Type</option>
                  <option value="normal">🟢 Normal</option>
                  <option value="CriticalCare">⚠️ CriticalCare</option>
                  <option value="MLC">🚨 MLC</option>
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditSave}
              disabled={loading}
            >
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>

      {/* CSS Animation for Floating Elements */}
      <style>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
};

export default Report;
