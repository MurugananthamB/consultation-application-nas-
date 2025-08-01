const path = require("path");
const dotenv = require("dotenv");

// ✅ Load .env before using process.env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const fs = require("fs");
const multer = require("multer");
const { Readable } = require("stream");
const User = require("./models/User");
const cloudinary = require("./cloudinaryConfig");
const jwt = require("jsonwebtoken");
const https = require("https");
const patientRoutes = require("./routes/bbpatientRoutes");

// ✅ Storage path configuration using environment variables
const getStoragePath = () => {
  // Use environment variables for Windows NAS configuration
  const nasMountPath = process.env.NAS_MOUNT_PATH || "Z:";
  const nasFolder = process.env.NAS_FOLDER || "Video Record";
  
  // Construct the full NAS path
  const fullNasPath = path.join(nasMountPath, nasFolder);
  
  console.log('📁 NAS Mount Path (ENV):', nasMountPath);
  console.log('📁 NAS Folder (ENV):', nasFolder);
  console.log('📁 Full NAS Path resolved:', fullNasPath);
  
  return fullNasPath;
};

const NAS_FULL_PATH = getStoragePath();

const videoRoutes = require("./routes/videoRoutes");

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1]; // Expect "Bearer <token>"
  if (!token) {
    return res.status(401).json({ message: "Invalid token format" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    req.user = decoded; // Attach user info to request
    next();
  });
}

dotenv.config(); // ✅ Load .env first

const app = express();

// Security middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(express.json());

// CORS setup
app.use(
  cors({
    origin: "*", // Allow all origins
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  next();
});

// Rate limiter (skip OPTIONS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return next();
  limiter(req, res, next);
});

// ===== Storage Path Config =====

app.post("/api/update-storage-path", (req, res) => {
  const { nasMountPath, nasFolder } = req.body;
  if (!nasMountPath || !nasFolder) {
    return res.status(400).json({ error: "Both NAS_MOUNT_PATH and NAS_FOLDER are required" });
  }
  
  // Update environment variables (this would require restart in production)
  process.env.NAS_MOUNT_PATH = nasMountPath;
  process.env.NAS_FOLDER = nasFolder;
  
  const fullPath = getStoragePath();
  
  res.json({
    success: true,
    message: "NAS storage path updated successfully",
    nasMountPath,
    nasFolder,
    fullPath
  });
});

app.get("/api/get-storage-path", (req, res) => {
  const fullPath = getStoragePath();
  const nasMountPath = process.env.NAS_MOUNT_PATH || "Z:";
  const nasFolder = process.env.NAS_FOLDER || "Video Record";
  
  res.json({ 
    fullPath,
    nasMountPath,
    nasFolder
  });
});

// ===== Cloudinary Video Upload =====
// const upload = multer({ storage: multer.memoryStorage() });

// app.post('/api/save-video', upload.single('videoFile'), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: 'No video file uploaded' });
//   }

//   const folder = getStoragePath();
//   const stream = cloudinary.uploader.upload_stream(
//     {
//       resource_type: 'video',
//       folder
//     },
//     (error, result) => {
//       if (error) {
//         return res.status(500).json({ error: error.message });
//       }
//       res.json({
//         success: true,
//         message: 'Video uploaded successfully to Cloudinary',
//         videoUrl: result.secure_url,
//         publicId: result.public_id
//       });
//     }
//   );

//   Readable.from(req.file.buffer).pipe(stream);
// });

// ===== NAS Video Upload =====
// ===== NAS Video Upload (Updated with Date-wise Folder) =====
const dayjs = require("dayjs"); // Add at the top if not already

const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/save-video", upload.single("videoFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No video file uploaded" });
  }

  const patientUHID = req.body.patientUHID || "unknown";
  const patientName = req.body.patientName || "unknown";

  const sanitizeFilename = (str) =>
    str
      .replace(/[^a-zA-Z0-9\s\-_]/g, "")
      .replace(/\s+/g, "_")
      .trim();

  const sanitizedUHID = sanitizeFilename(patientUHID);
  const sanitizedName = sanitizeFilename(patientName);

  const today = dayjs().format("DD-MM-YYYY"); // 👈 Format: 25-07-2025
  const datedFolder = path.join(NAS_FULL_PATH, today);

  // 👇 Create date-wise folder if it doesn’t exist
  if (!fs.existsSync(datedFolder)) {
    fs.mkdirSync(datedFolder, { recursive: true });
  }

  // 👇 Build full filename with patient info
  let filename = `${sanitizedUHID}_${sanitizedName}.webm`;
  let fullPath = path.join(datedFolder, filename);

  // 👇 Avoid overwriting: Add counter if file exists
  let counter = 1;
  while (fs.existsSync(fullPath)) {
    filename = `${sanitizedUHID}_${sanitizedName}_${counter}.webm`;
    fullPath = path.join(datedFolder, filename);
    counter++;
  }

  try {
    fs.writeFileSync(fullPath, req.file.buffer);

    console.log("✅ Video saved to:", fullPath);
    console.log("👤 Patient:", `${patientName} (${patientUHID})`);

    res.status(200).json({
      success: true,
      message: "Video saved to NAS",
      filename,
      savedPath: fullPath,
      patientInfo: { uhid: patientUHID, name: patientName },
    });
  } catch (error) {
    console.error("❌ Error saving video:", error);
    res
      .status(500)
      .json({ error: "Failed to save video", details: error.message });
  }
});

// ===== Logging and Routes =====
app.use(morgan("dev"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/consultations", require("./routes/consultations"));
app.use("/api", patientRoutes);
app.use("/api", videoRoutes);

// route
// app.put('/api/consultations/:id', verifyToken, (req, res) => {
//   // Your update logic here
// });

// Health check route
app.get("/", (req, res) => {
  res.send("Consultation-app Backend is running 🚀");
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ===== MongoDB + Server Startup =====
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in .env");
  process.exit(1);
}

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    console.log("✅ Connected to MongoDB");

    try {
      await User.createDefaultAdmin();
      console.log("✅ Admin user ensured");
    } catch (adminError) {
      console.error("⚠️ Admin creation error:", adminError);
    }

    const https = require("https");

    const PORT = process.env.PORT || 5000;
    const sslOptions = {
      key: fs.readFileSync(path.join(__dirname, "certs", "localhost-key.pem")),
      cert: fs.readFileSync(path.join(__dirname, "certs", "localhost.pem")),
    };

    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`🔒 HTTPS server running at https://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup error:", err);
    process.exit(1);
  }
}

startServer();

// ===== Exit on unhandled promise rejections =====
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});
