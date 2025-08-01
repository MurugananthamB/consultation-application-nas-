STANDARD OPERATING PROCEDURE (SOP) - CONSULTATION APP
================================================================

1. PROJECT OVERVIEW
===================

The Consultation App is a comprehensive healthcare video consultation platform designed for medical professionals to conduct and record patient consultations. The application provides secure video recording, storage, and management capabilities with role-based access control for doctors and administrators.

Key Features:
- Video Recording: Real-time video capture during consultations
- NAS Storage Integration: Secure video storage on Network Attached Storage
- Patient Management: Complete patient information tracking with UHID
- Report Generation: PDF and Excel export capabilities
- Role-based Access: Doctor and Admin user roles
- Docker Deployment: Containerized application with NGINX reverse proxy

2. TECHNOLOGIES USED
====================

Frontend Technologies:
- React 19.1.0: Modern JavaScript framework for UI
- React Bootstrap 2.10.9: UI component library
- Framer Motion 12.7.4: Animation library
- Axios 1.8.4: HTTP client for API communication
- React Router DOM 7.5.1: Client-side routing
- jsPDF 3.0.1: PDF generation
- XLSX 0.18.5: Excel file generation
- WebM Duration Fix 1.0.4: Video duration handling

Backend Technologies:
- Node.js 18: JavaScript runtime
- Express.js 4.18.2: Web framework
- MongoDB: NoSQL database with Mongoose ODM
- JWT: JSON Web Token authentication
- bcryptjs 2.4.3: Password hashing
- Multer 1.4.5: File upload handling
- Helmet 7.0.0: Security middleware
- Morgan 1.10.0: HTTP request logging

Infrastructure & DevOps:
- Docker: Containerization
- NGINX: Reverse proxy and static file serving
- HTTPS/SSL: Secure communication
- NAS Storage: Network Attached Storage for video files
- GitHub Container Registry (GHCR): Container image registry

3. FOLDER STRUCTURE
===================
```
consultation-app/
├── backend/                    # Backend Node.js application
│   ├── auth/                   # Authentication utilities
│   │   └── mssqlConnect.js    # Database connection (legacy)
│   ├── controllers/            # Business logic controllers
│   │   ├── bbpatientController.js
│   │   └── videoController.js  # Video streaming and filtering
│   ├── middleware/             # Express middleware
│   │   └── auth.js            # JWT authentication middleware
│   ├── models/                 # MongoDB schemas
│   │   ├── Consultation.js    # Consultation data model
│   │   ├── StorageSettings.js # Storage configuration
│   │   └── User.js           # User authentication model
│   ├── routes/                 # API route definitions
│   │   ├── auth.js           # Authentication routes
│   │   ├── bbpatientRoutes.js # Patient management routes
│   │   ├── consultations.js   # Consultation CRUD routes
│   │   └── videoRoutes.js    # Video streaming routes
│   ├── cloudinaryConfig.js    # Cloud storage configuration
│   ├── server.js              # Main application entry point
│   └── package.json           # Backend dependencies
├── frontend/                   # React frontend application
│   ├── public/                # Static assets
│   │   ├── index.html        # Main HTML template
│   │   └── manifest.json     # PWA manifest
│   ├── src/                   # React source code
│   │   ├── context/          # React context providers
│   │   │   └── AuthContext.js # Authentication context
│   │   ├── pages/            # Application pages
│   │   │   ├── AdminDashboard.js
│   │   │   ├── DoctorLogin.js
│   │   │   ├── DoctorRegister.js
│   │   │   ├── Home.js       # Main consultation interface
│   │   │   ├── Report.js     # Report generation page
│   │   │   └── StorageSettings.js
│   │   ├── services/         # API service layer
│   │   │   └── api.js       # Axios configuration and API calls
│   │   ├── App.js           # Main React component
│   │   └── index.js         # React entry point
│   ├── nginx.conf           # NGINX configuration
│   └── package.json         # Frontend dependencies
├── Dockerfile               # Multi-stage Docker build
└── consultation-app.tar     # Application archive
```

4. APPLICATION FEATURES
=======================

Core Functionality:
1. User Authentication: JWT-based login with role-based access
2. Video Recording: Real-time consultation recording with WebM format
3. Patient Management: UHID-based patient tracking
4. Consultation Tracking: Complete consultation lifecycle management
5. Video Storage: NAS-based secure video storage with date-based organization
6. Report Generation: PDF and Excel export with filtering capabilities
7. Video Playback: Secure video streaming with range request support
8. Admin Dashboard: Administrative interface for user management

User Roles:
- Doctor: Can create consultations, record videos, view reports
- Admin: Full access including user management and system settings

5. STEP-BY-STEP SETUP GUIDE
============================

Development Environment Setup:

Prerequisites:
- Node.js 18+ installed
- MongoDB instance running
- NAS storage mounted and accessible
- Git installed

Backend Setup:
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Configure environment variables
MONGODB_URI=mongodb://localhost:27017/consultation-app
JWT_SECRET=your-secret-key-here
NAS_MOUNT_PATH=Z:
NAS_FOLDER=Video Record
PORT=5000

# 5. Start development server
npm run dev
```

Frontend Setup:
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env file
REACT_APP_API_URL=https://localhost:5000/api

# 4. Start development server
npm start
```

Production Environment Setup:

Using Docker:
```bash
# 1. Build Docker image
docker build -t consultation-app .

# 2. Run container
docker run -p 443:443 -p 5000:5000 \
  -e MONGODB_URI=your-mongodb-uri \
  -e JWT_SECRET=your-secret-key \
  -e NAS_MOUNT_PATH=/mnt/nas \
  -e NAS_FOLDER=Video Record \
  consultation-app
```

Manual Production Setup:
```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Configure NGINX
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo systemctl restart nginx

# 3. Start backend with PM2
cd backend
npm install -g pm2
pm2 start server.js --name consultation-app
```

6. HOW TO DEPLOY VIA DOCKER & GHCR
====================================

Building and Pushing to GHCR:

```bash
# 1. Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 2. Build image with GHCR tag
docker build -t ghcr.io/USERNAME/consultation-app:latest .

# 3. Push to GHCR
docker push ghcr.io/USERNAME/consultation-app:latest

# 4. Deploy from GHCR
docker pull ghcr.io/USERNAME/consultation-app:latest
docker run -d \
  --name consultation-app \
  -p 443:443 -p 5000:5000 \
  -e MONGODB_URI=your-mongodb-uri \
  -e JWT_SECRET=your-secret-key \
  -e NAS_MOUNT_PATH=/mnt/nas \
  -e NAS_FOLDER=Video Record \
  ghcr.io/USERNAME/consultation-app:latest
```

Docker Compose Deployment:
```yaml
version: '3.8'
services:
  consultation-app:
    image: ghcr.io/USERNAME/consultation-app:latest
    ports:
      - "443:443"
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/consultation-app
      - JWT_SECRET=your-secret-key
      - NAS_MOUNT_PATH=/mnt/nas
      - NAS_FOLDER=Video Record
    volumes:
      - /mnt/nas:/mnt/nas:ro
    depends_on:
      - mongo
  
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

7. HOW NAS VIDEO STORAGE INTEGRATION WORKS
===========================================

Storage Architecture:
- Primary Storage: Network Attached Storage (NAS) mounted at /mnt/nas-biometrics
- Organization: Date-based folder structure (DD-MM-YYYY format)
- File Naming: {MongoDB_ObjectId}.webm format
- Access Control: Read-only access for video streaming

Video Upload Process:
1. Recording: Frontend captures video using MediaRecorder API
2. Upload: Video blob sent to /api/save-video endpoint
3. Processing: Backend receives video and generates filename using MongoDB ObjectId
4. Storage: Video saved to NAS with date-based folder structure
5. Database: Consultation record updated with video metadata

Video Streaming Process:
1. Request: Frontend requests video via /api/videos/{date}/{filename}
2. Validation: Backend checks file existence on NAS
3. Streaming: Video streamed with range request support for efficient playback
4. Security: JWT authentication required for video access

File Structure Example:
```
/mnt/nas-biometrics/
├── 25-07-2025/
│   ├── 507f1f77bcf86cd799439011.webm
│   ├── 507f1f77bcf86cd799439012.webm
│   └── 507f1f77bcf86cd799439013.webm
├── 26-07-2025/
│   ├── 507f1f77bcf86cd799439014.webm
│   └── 507f1f77bcf86cd799439015.webm
```

8. HOW MONGODB MODELS ARE STRUCTURED
=====================================

User Model (User.js):
```javascript
{
  name: String,           // User's full name
  doctorId: String,       // Unique doctor identifier
  password: String,       // Hashed password (bcrypt)
  role: String,           // 'doctor' or 'admin'
  createdAt: Date,        // Account creation timestamp
  updatedAt: Date         // Last update timestamp
}
```

Consultation Model (Consultation.js):
```javascript
{
  patientName: String,        // Patient's full name
  uhidId: String,            // Unique Health Identifier
  department: String,         // Medical department
  doctor: ObjectId,          // Reference to User model
  doctorName: String,        // Doctor's name
  attenderName: String,      // Attending person's name
  icuConsultantName: String, // ICU consultant name
  videoFileName: String,     // Associated video filename
  date: Date,               // Consultation date
  recordingDuration: Number, // Video duration in seconds
  status: String,           // 'completed', 'pending', 'cancelled'
  notes: String,            // Additional notes
  createdAt: Date,          // Record creation timestamp
  updatedAt: Date           // Last update timestamp
}
```

Indexes for Performance:
- uhidId: For patient lookup
- doctor: For doctor-specific queries
- date: For date-based filtering and sorting

9. EXPLANATION OF API ROUTES AND CONTROLLERS
=============================================

Authentication Routes (/api/auth):
- POST /login: User authentication with JWT token generation
- POST /register: New user registration
- POST /logout: User logout (token invalidation)

Consultation Routes (/api/consultations):
- POST /: Create new consultation
- GET /: Get all consultations with filtering
- GET /doctor: Get doctor-specific consultations
- GET /uhid/:uhidId: Get consultation by UHID
- PUT /:id: Update consultation details
- DELETE /:id: Delete consultation

Video Routes (/api/videos):
- GET /:date/:filename: Stream video from NAS
- GET /filter: Get filtered consultation metadata
- POST /save-video: Upload video to NAS

Patient Routes (/api/patient):
- GET /:uhid: Get patient information by UHID

Storage Routes (/api):
- GET /get-storage-path: Get current NAS storage configuration
- POST /update-storage-path: Update NAS storage settings

10. AUTHENTICATION & AUTHORIZATION FLOW
=======================================

Authentication Process:
1. Login Request: User submits doctorId and password
2. Validation: Backend validates credentials against database
3. Token Generation: JWT token created with user role and ID
4. Response: Token and user data returned to frontend
5. Storage: Token stored in localStorage for subsequent requests

Authorization Middleware:
- protect: Verifies JWT token and attaches user to request
- authorize: Checks user role against required permissions
- Role-based Access: Different endpoints accessible based on user role

Security Features:
- Password Hashing: bcrypt with salt rounds
- JWT Expiration: 24-hour token validity
- CORS Configuration: Cross-origin request handling
- Rate Limiting: Request throttling for API protection
- Input Validation: Express-validator for request sanitization

11. HOW VIDEO UPLOAD & STREAMING WORKS
=======================================

Video Recording Process:
1. Media Access: Frontend requests camera/microphone permissions
2. Recording Start: MediaRecorder API captures video stream
3. Chunk Collection: Video data collected in chunks
4. Blob Creation: Final video blob created with WebM format
5. Upload: Video sent to backend via FormData

Video Upload Process:
1. File Reception: Multer middleware handles multipart form data
2. Filename Generation: MongoDB ObjectId used for unique filename
3. Folder Creation: Date-based folder created on NAS if needed
4. File Storage: Video saved to NAS with proper error handling
5. Database Update: Consultation record updated with video metadata

Video Streaming Process:
1. Request Validation: Backend validates file existence on NAS
2. Range Support: HTTP range requests for efficient streaming
3. Content-Type: Proper MIME type detection (video/webm)
4. Stream Response: Video streamed with appropriate headers
5. Error Handling: 404 for missing files, 500 for server errors

Video Playback Features:
- Range Requests: Support for seeking and partial content
- Blob URLs: Frontend creates object URLs for video playback
- Memory Management: Proper cleanup of blob URLs to prevent leaks
- Error Recovery: Graceful handling of network issues

12. HOW CONSULTATION AND VIDEO FILE NAMING WORKS
================================================

Consultation Naming Convention:
- UHID: Unique Health Identifier for patient identification
- Patient Name: Full patient name for easy identification
- Date: Consultation date in ISO format
- Doctor: Associated doctor information
- Status: Consultation status (completed, pending, cancelled)

Video File Naming Convention:
- Format: {MongoDB_ObjectId}.webm
- Example: 507f1f77bcf86cd799439011.webm
- Uniqueness: MongoDB ObjectId ensures global uniqueness
- Extension: WebM format for web compatibility

Folder Organization:
- Date Format: DD-MM-YYYY (e.g., 25-07-2025)
- Path Structure: /mnt/nas-biometrics/25-07-2025/
- File Location: Videos stored in date-based folders for easy management

Database Relationships:
- Consultation ID: Links consultation record to video file
- Date Matching: Video folder date matches consultation date
- Metadata Storage: Video duration, filename stored in consultation record

13. ERROR HANDLING & LOGGING
============================

Error Handling Strategy:
- Global Error Handler: Express middleware for unhandled errors
- Validation Errors: Express-validator for input validation
- Database Errors: Mongoose error handling for database operations
- File System Errors: Try-catch blocks for NAS operations
- Network Errors: Axios interceptors for API error handling

Logging Implementation:
- Morgan: HTTP request logging middleware
- Console Logging: Structured logging for debugging
- Error Tracking: Detailed error messages with stack traces
- Performance Monitoring: Request timing and response codes

Error Categories:
- Authentication Errors: 401 Unauthorized, 403 Forbidden
- Validation Errors: 400 Bad Request with detailed messages
- Database Errors: 500 Internal Server Error for DB issues
- File System Errors: 404 Not Found for missing videos
- Network Errors: Timeout and connection error handling

14. ENVIRONMENT VARIABLE DETAILS
=================================

Required Environment Variables:

Backend (.env):
```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/consultation-app

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=5000
NODE_ENV=production

# NAS Storage Configuration
NAS_MOUNT_PATH=/mnt/nas-biometrics
NAS_FOLDER=Video Record

# Cloudinary Configuration (optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Frontend (.env):
```bash
# API Configuration
REACT_APP_API_URL=https://your-domain.com/api

# Development Configuration
REACT_APP_DEV_MODE=true
```

Environment-Specific Configurations:

Development:
- NODE_ENV=development
- PORT=5000
- MONGODB_URI=mongodb://localhost:27017/consultation-app-dev

Production:
- NODE_ENV=production
- PORT=5000
- MONGODB_URI=mongodb://production-db:27017/consultation-app
- NAS_MOUNT_PATH=/mnt/nas-biometrics

Docker:
- Environment variables passed via Docker run or docker-compose
- SSL certificates mounted as volumes
- NAS storage mounted as read-only volume

15. BEST PRACTICES FOLLOWED IN THE PROJECT
==========================================

Security Best Practices:
- JWT Authentication: Secure token-based authentication
- Password Hashing: bcrypt with salt rounds for password security
- Input Validation: Express-validator for request sanitization
- CORS Configuration: Proper cross-origin request handling
- Rate Limiting: Request throttling to prevent abuse
- Helmet: Security headers middleware
- HTTPS: SSL/TLS encryption for all communications

Code Quality Practices:
- Modular Architecture: Separation of concerns with MVC pattern
- Error Handling: Comprehensive error handling throughout application
- Logging: Structured logging for debugging and monitoring
- Environment Configuration: Environment-specific configurations
- Input Validation: Server-side validation for all inputs
- Database Indexing: Proper MongoDB indexes for performance

Performance Best Practices:
- Video Streaming: Range request support for efficient video playback
- Database Indexing: Optimized queries with proper indexes
- Caching: Browser caching for static assets
- Compression: Gzip compression for API responses
- Pagination: Client-side pagination for large datasets

Deployment Best Practices:
- Docker Containerization: Consistent deployment across environments
- Multi-stage Builds: Optimized Docker images
- Environment Variables: Secure configuration management
- Health Checks: Application health monitoring
- Reverse Proxy: NGINX for load balancing and SSL termination

16. FUTURE IMPROVEMENT SUGGESTIONS
===================================

Technical Enhancements:
1. Real-time Features: WebSocket integration for live consultations
2. Video Compression: Server-side video compression for storage optimization
3. CDN Integration: Content Delivery Network for global video distribution
4. Microservices Architecture: Break down monolith into microservices
5. API Versioning: Implement API versioning for backward compatibility
6. Caching Layer: Redis integration for session and data caching
7. Monitoring: Application performance monitoring (APM) integration
8. Automated Testing: Comprehensive unit and integration tests

Security Enhancements:
1. Two-Factor Authentication: TOTP-based 2FA for enhanced security
2. Audit Logging: Comprehensive audit trail for compliance
3. Data Encryption: At-rest encryption for sensitive data
4. API Rate Limiting: Per-user rate limiting
5. Security Headers: Enhanced security headers configuration

User Experience Improvements:
1. Mobile App: React Native application for mobile access
2. Offline Support: Service worker for offline functionality
3. Video Quality Settings: Adjustable video quality options
4. Bulk Operations: Batch processing for multiple consultations
5. Advanced Search: Full-text search with filters
6. Dashboard Analytics: Real-time analytics and reporting
7. Notification System: Email and push notifications
8. Multi-language Support: Internationalization (i18n)

Infrastructure Improvements:
1. Kubernetes Deployment: Container orchestration for scalability
2. Auto-scaling: Horizontal pod autoscaling
3. Load Balancing: Multiple backend instances
4. Database Clustering: MongoDB replica set for high availability
5. Backup Strategy: Automated backup and recovery procedures
6. Disaster Recovery: Multi-region deployment strategy
7. CI/CD Pipeline: Automated testing and deployment
8. Infrastructure as Code: Terraform or CloudFormation templates.


===========================================

Document Version: 1.0

Last Updated: July 2025

Maintained By: APH Development Team

Review Cycle: Quarterly

===========================================