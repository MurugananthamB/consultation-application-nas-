# 🏥 Doctor Consultation Application

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green.svg)](https://mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)

A comprehensive healthcare video consultation platform designed for medical professionals to conduct, record, and manage patient consultations with advanced features including role-based access control, location management, and secure video storage.

## 📋 Table of Contents

- [🎯 Project Overview](#-project-overview)
- [✨ Key Features](#-key-features)
- [🔧 Technologies Used](#-technologies-used)
- [📁 Project Structure](#-project-structure)
- [🚀 Quick Start Guide](#-quick-start-guide)
- [🔐 Authentication & Authorization](#-authentication--authorization)
- [📊 Database Models](#-database-models)
- [🛣️ API Routes](#️-api-routes)
- [🎥 Video Management](#-video-management)
- [📍 Location & Master Data](#-location--master-data)
- [📈 Reports & Analytics](#-reports--analytics)
- [🚢 Deployment](#-deployment)

## 🎯 Project Overview

The Doctor Consultation Application is a full-stack healthcare platform that enables medical professionals to:
- **Conduct secure video consultations** with patients
- **Record and store consultation videos** on Network Attached Storage (NAS)
- **Manage patient information** with UHID-based tracking
- **Generate comprehensive reports** with PDF and Excel export
- **Administer master data** including doctors, ICU consultants, and locations
- **Control access** through role-based authentication

## ✨ Key Features

### 🎥 **Video Consultation Management**
- **Real-time Video Recording**: WebM format with duration tracking
- **Secure Video Storage**: NAS integration with date-based organization
- **Video Streaming**: Range request support for efficient playback
- **File Management**: MongoDB ObjectId-based unique naming

### 👥 **User Management & Authentication**
- **Role-based Access Control**: Doctor and Admin roles
- **JWT Authentication**: Secure token-based authentication
- **Password Security**: bcrypt hashing with salt rounds
- **Location-based Filtering**: Users restricted to their location data
- **Default Admin**: Automatic admin user creation with secure defaults

### 📊 **Master Data Management**
- **Doctor Master**: CRUD operations for doctor information
- **ICU Consultant Master**: Management of ICU consultant data
- **Location Master**: Hospital location/branch management
- **Status Control**: Active/Inactive status for all master data
- **Dynamic Dropdowns**: API-driven form population

### 📋 **Patient & Consultation Tracking**
- **UHID-based System**: Unique Health Identifier tracking
- **Comprehensive Records**: Patient demographics, consultations, videos
- **Condition Types**: Normal, Critical Care, MLC categorization
- **Department Integration**: Medical department association
- **Duration Tracking**: Automatic video duration calculation

### 📈 **Advanced Reporting & Analytics**
- **Multi-format Export**: PDF and Excel report generation
- **Advanced Filtering**: Date range, doctor, department, location filters
- **Real-time Data**: Live consultation statistics
- **Location-based Reports**: Role-specific data access
- **Pagination**: Efficient large dataset handling

### 🔐 **Security & Privacy**
- **Data Encryption**: Secure password storage and JWT tokens
- **Role-based Authorization**: Granular access control
- **Input Validation**: Server-side validation with express-validator
- **CORS Protection**: Cross-origin request security
- **Rate Limiting**: API abuse prevention

## 🔧 Technologies Used

### **Frontend Stack**
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1.0 | Modern UI framework |
| **React Bootstrap** | 2.10.9 | Responsive UI components |
| **Framer Motion** | 12.7.4 | Smooth animations |
| **React Router DOM** | 7.5.1 | Client-side routing |
| **Axios** | 1.8.4 | HTTP client for API calls |
| **React Icons** | 5.5.0 | Icon library |
| **jsPDF** | 3.0.1 | PDF generation |
| **XLSX** | 0.18.5 | Excel file handling |
| **WebM Duration Fix** | 1.0.4 | Video duration processing |

### **Backend Stack**
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | 4.18.2 | Web framework |
| **MongoDB** | 7.0+ | NoSQL database |
| **Mongoose** | 7.0.3 | MongoDB ODM |
| **JWT** | 9.0.0 | Authentication tokens |
| **bcryptjs** | 2.4.3 | Password hashing |
| **Multer** | 1.4.5 | File upload handling |
| **Express Validator** | 7.2.1 | Input validation |

### **Infrastructure & DevOps**
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **NGINX** | Reverse proxy & static serving |
| **NAS Storage** | Video file storage |
| **PM2** | Process management |

## 📁 Project Structure

```
consultation-app/
├── 📂 backend/                    # Backend Node.js application
│   ├── 📂 controllers/            # Business logic controllers
│   │   ├── masterController.js    # Master data CRUD
│   │   └── videoController.js     # Video streaming & filtering
│   ├── 📂 middleware/             # Express middleware
│   │   └── auth.js               # JWT authentication & authorization
│   ├── 📂 models/                 # MongoDB schemas
│   │   ├── User.js               # User authentication model
│   │   ├── Consultation.js       # Consultation data model
│   │   ├── Doctor.js             # Doctor master model
│   │   ├── IcuConsultant.js      # ICU consultant model
│   │   ├── Location.js           # Location master model
│   │   └── StorageSettings.js    # Storage configuration
│   ├── 📂 routes/                 # API route definitions
│   │   ├── auth.js               # Authentication routes
│   │   ├── consultations.js      # Consultation CRUD routes
│   │   ├── masters.js            # Master data routes
│   │   └── videoRoutes.js        # Video streaming routes
│   └── 📄 server.js              # Main application entry point
├── 📂 frontend/                   # React frontend application
│   ├── 📂 src/                   # React source code
│   │   ├── 📂 components/        # Reusable UI components
│   │   ├── 📂 context/           # React context providers
│   │   ├── 📂 pages/             # Application pages/screens
│   │   │   ├── Home.js           # Main consultation interface
│   │   │   ├── Report.js         # Report generation & analytics
│   │   │   ├── Masters.jsx       # Master data management
│   │   │   ├── AdminDashboard.js # Admin-only dashboard
│   │   │   ├── DoctorLogin.js    # Login page
│   │   │   └── DoctorRegister.js # Registration page
│   │   └── 📂 services/          # API service layer
│   └── 📄 package.json          # Frontend dependencies
└── 📄 Dockerfile                # Multi-stage Docker build
```

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** 18+ installed
- **MongoDB** 7.0+ running
- **Git** for version control
- **NAS storage** mounted and accessible (for video storage)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd consultation-app
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
MONGODB_URI=mongodb://localhost:27017/consultation-app
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NAS_MOUNT_PATH=/mnt/nas-biometrics
NAS_FOLDER=Video Record

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
echo "REACT_APP_API_URL=https://localhost:5000/api" > .env

# Start development server
npm start
```

### 4. Default Admin Access
- **Username**: `admin`
- **Password**: `admin123`
- **Location**: `APH`

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: https://localhost:5000/api

## 🔐 Authentication & Authorization

### User Roles
| Role | Access Level | Permissions |
|------|-------------|-------------|
| **Doctor** | Standard User | • Create consultations<br>• Record videos<br>• View own location reports<br>• Access master dropdowns |
| **Admin** | Full Access | • All doctor permissions<br>• Manage master data<br>• View all location reports<br>• User management<br>• System settings |

### Authorization Middleware
- **`protect`**: Verifies JWT token and attaches user to request
- **`authorize`**: Checks user role against required permissions
- **`verifyAdmin`**: Custom middleware for admin-only endpoints

## 📊 Database Models

### User Model
```javascript
{
  name: String,              // User's full name
  doctorId: String,          // Unique doctor identifier
  password: String,          // Hashed password (bcrypt)
  role: String,              // 'doctor' or 'admin'
  location: String,          // User's assigned location
  createdAt: Date,           // Account creation timestamp
  updatedAt: Date            // Last update timestamp
}
```

### Consultation Model
```javascript
{
  patientName: String,        // Patient's full name
  uhidId: String,            // Unique Health Identifier
  department: String,         // Medical department
  doctor: ObjectId,          // Reference to User model
  doctorName: String,        // Doctor's name
  attenderName: String,      // Attending person's name
  icuConsultantName: String, // ICU consultant name
  conditionType: String,     // 'normal', 'CriticalCare', 'MLC'
  location: String,          // Consultation location
  videoFileName: String,     // Associated video filename
  date: Date,               // Consultation date
  recordingDuration: Number, // Video duration in seconds
  status: String,           // 'completed', 'pending', 'cancelled'
  notes: String,            // Additional consultation notes
  createdAt: Date,          // Record creation timestamp
  updatedAt: Date           // Last update timestamp
}
```

### Master Data Models
- **Doctor Model**: `{ name: String, createdAt: Date, updatedAt: Date }`
- **ICU Consultant Model**: `{ name: String, createdAt: Date, updatedAt: Date }`
- **Location Model**: `{ name: String, status: String, createdAt: Date, updatedAt: Date }`

---

## 🚢 Deployment

### Docker Deployment (Recommended)
```bash
# Build Docker image
docker build -t consultation-app .

# Run container
docker run -d \
  --name consultation-app \
  -p 443:443 -p 5000:5000 \
  -e MONGODB_URI="mongodb://your-mongo-host:27017/consultation-app" \
  -e JWT_SECRET="your-super-secret-jwt-key" \
  -e NAS_MOUNT_PATH="/mnt/nas-biometrics" \
  -v /path/to/nas:/mnt/nas-biometrics:ro \
  consultation-app
```

### Manual Production Setup
```bash
# Frontend Build
cd frontend
npm run build

# Backend with PM2
cd backend
npm install -g pm2
pm2 start server.js --name consultation-app
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

---

<div align="center">

**Built with ❤️ by the APH Development Team**

*Empowering healthcare professionals with modern technology*

</div>

