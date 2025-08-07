import axios from "axios";

export const API_URL =
  process.env.REACT_APP_API_URL || "https://192.168.103.158:5003/api";
  
  // "https://192.168.101.47:5000/api";

// 'http://localhost:5000/api';

// 'https://consultation-backend-nmyg.onrender.com/api'

// 'https://consultation-backend-nmyg.onrender.com/api'; // Replace with your backend URL

// 'https://consultation-backend-nmyg.onrender.com';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Test backend connectivity
export const testBackendConnection = async () => {
  try {
    console.log("Testing backend connection to:", API_URL);
    const response = await axios.get(`${API_URL.replace('/api', '')}/health`, { timeout: 5000 });
    console.log("Backend is reachable:", response.status);
    return true;
  } catch (error) {
    console.error("Backend connection test failed:", error.message);
    return false;
  }
};

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/doctor-login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials) => {
    console.log("Making login request with credentials:", {
      doctorId: credentials.doctorId,
      password: "***", // Don't log the actual password
    });
    console.log("API URL being used:", API_URL);
    
    // Try different possible login endpoints
    const loginEndpoints = [
      "/auth/login",
      "/api/auth/login", 
      "/doctor/login",
      "/api/doctor/login",
      "/login"
    ];
    
    for (const endpoint of loginEndpoints) {
      try {
        console.log(`Trying login endpoint: ${endpoint}`);
        const response = await api.post(endpoint, credentials);
        console.log("Login response:", response.data);

        if (!response.data.success) {
          console.error("Login failed:", response.data.message);
          throw new Error(response.data.message || "Login failed");
        }

        if (!response.data.token) {
          console.error("No token in response:", response.data);
          throw new Error("No authentication token received");
        }

        console.log("Storing token and user data");
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        return response;
      } catch (error) {
        console.log(`Endpoint ${endpoint} failed:`, error.response?.status, error.response?.statusText);
        if (error.response?.status === 404) {
          continue; // Try next endpoint
        }
        // If it's not a 404, it might be a different error (like 401, 500, etc.)
        console.error("Login API error:", error.response?.data || error.message);
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw error;
      }
    }
    
    // If all endpoints failed
    throw new Error("Login failed: No valid login endpoint found. Please check your backend configuration.");
  },
  register: (data) => api.post("/auth/register", data),
  getCurrentUser: () => api.get("/auth/me"),
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return api.post("/auth/logout");
  },
  changePassword: async (passwordData) => {
    try {
      console.log("Making change password request");
      const response = await api.put("/auth/change-password", passwordData);
      console.log("Change password response:", response.data);
      return response;
    } catch (error) {
      console.error("Change password API error:", error.response?.data || error.message);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },
};

// Video Upload API
export const videoAPI = {
  uploadToNAS: (formData) => {
    return api.post("/save-video", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// Consultation API
export const consultationAPI = {
  create: (data) => api.post("/consultations", data),
  getAll: async (filters = {}) => {
    try {
      console.log("Fetching consultations with filters:", filters);
      const response = await api.get("/consultations", { params: filters });
      console.log("Consultations response:", response.data);

      if (!response.data) {
        throw new Error("No data received from server");
      }

      return response;
    } catch (error) {
      console.error(
        "Error fetching consultations:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
  getById: (id) => api.get(`/consultations/${id}`),
  update: (id, data) => api.put(`/consultations/${id}`, data),
  delete: (id) => api.delete(`/consultations/${id}`),
  uploadVideo: (formData, onUploadProgress) =>
    api.post("/consultations/upload-video", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    }),
  getVideoUrl: (path) => api.get(`/consultations/video/${path}`),
};

// Patient API
export const patientAPI = {
  getByUhid: async (uhid) => {
    try {
      console.log("Fetching patient with UHID:", uhid);
      const response = await api.get(`/patient/${uhid}`);
      console.log("Patient response:", response.data);
      return response;
    } catch (error) {
      console.error(
        "Error fetching patient:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default api;
