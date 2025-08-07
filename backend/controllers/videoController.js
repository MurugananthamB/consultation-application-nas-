const fs = require("fs");
const path = require("path");
const Consultation = require("../models/Consultation");

// const getStoragePath = (reqDate) => {
//     // Use environment variables for Windows NAS configuration
//     const nasMountPath = process.env.NAS_MOUNT_PATH ;
//     const nasFolder = process.env.NAS_FOLDER ;
    
//     // Construct the full NAS path
//     const fullNasPath = path.join(nasMountPath, nasFolder);


// Load storage path configuration using environment variables
const getStoragePath = (reqDate) => {
  const fullNasPath = "/mnt/nas-biometrics";

  // Use provided date from API or default to today
  const folderName =
    reqDate || new Date().toLocaleDateString("en-GB").split("/").join("-"); // dd-mm-yyyy

  const datedPath = path.join(fullNasPath, folderName);
  console.log("📁 VideoController Full NAS Path resolved:", datedPath);

  return datedPath;
};


/**
 * 🔁 Stream video by ObjectId.webm from NAS folder
 * @route GET /api/videos/:date/:filename
 */
// exports.streamVideo = (req, res) => {
//   const { date, filename } = req.params;

//   const NAS_PATH = path.join(
//     getStoragePath(),
//     date // e.g., "30-07-2025"
//   );

//   const filePath = path.join(NAS_PATH, filename);

//   if (!fs.existsSync(filePath)) {
//     return res.status(404).json({ error: "Video not found" });
//   }

//   const stat = fs.statSync(filePath);
//   const fileSize = stat.size;
//   const range = req.headers.range;
//   const contentType = filename.endsWith(".mp4") ? "video/mp4" : "video/webm";

//   if (range) {
//     const parts = range.replace(/bytes=/, "").split("-");
//     const start = parseInt(parts[0], 10);
//     const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
//     const chunksize = end - start + 1;

//     const file = fs.createReadStream(filePath, { start, end });
//     const head = {
//       "Content-Range": `bytes ${start}-${end}/${fileSize}`,
//       "Accept-Ranges": "bytes",
//       "Content-Length": chunksize,
//       "Content-Type": contentType,
//     };

//     res.writeHead(206, head);
//     file.pipe(res);
//   } else {
//     const head = {
//       "Content-Length": fileSize,
//       "Content-Type": contentType,
//     };

//     res.writeHead(200, head);
//     fs.createReadStream(filePath).pipe(res);
//   }
// };

exports.streamVideo = (req, res) => {
  const { date, filename } = req.params;

  const NAS_PATH = getStoragePath(date); // pass the date directly
  const filePath = path.join(NAS_PATH, filename);

  console.log("📁 Checking:", filePath);

  if (!fs.existsSync(filePath)) {
    console.error("❌ File not found:", filePath);
    return res.status(404).json({ error: "Video not found" });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const contentType = filename.endsWith(".mp4") ? "video/mp4" : "video/webm";

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;

    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": contentType,
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": contentType,
    };

    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
};


/**
 * 📂 Get filtered consultation records with role and location-based access control
 * @route GET /api/videos/filter?uhid=&patientName=&department=&doctorName=&dateFrom=&dateTo=&location=
 */
exports.getFilteredVideos = async (req, res) => {
  try {
    const { dateFrom, dateTo, uhid, patientName, department, doctorName, conditionType, location } =
      req.query;
    const query = {};

    // 🔒 Role and location-based access control
    const userRole = req.user.role;
    const userLocation = req.user.location;

    console.log(`🔐 User accessing reports: Role=${userRole}, Location=${userLocation}`);

    // 🏥 Location-based filtering for non-admin users
    if (userRole !== 'admin') {
      // Normal users can only see consultations from their own location
      if (userLocation) {
        query.location = userLocation;
        console.log(`🔒 Non-admin user restricted to location: ${userLocation}`);
      } else {
        // If user has no location, they get no results
        console.log(`⚠️ Non-admin user has no location assigned, returning empty results`);
        return res.json([]);
      }
    } else {
      console.log(`👑 Admin user - access to all locations`);
    }

    // 🔒 Safe regex
    const escapeRegex = (text) =>
      text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    // 📅 Date range
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: from, $lte: to };
    }

    // 🔍 Field filters
    if (uhid) query.uhidId = { $regex: escapeRegex(uhid), $options: "i" };
    if (patientName)
      query.patientName = { $regex: escapeRegex(patientName), $options: "i" };
    if (department)
      query.department = { $regex: escapeRegex(department), $options: "i" };
    if (doctorName)
      query.doctorName = { $regex: escapeRegex(doctorName), $options: "i" };
    if (conditionType)
      query.conditionType = { $regex: escapeRegex(conditionType), $options: "i" };
    
    // 📍 Location filter (for admin users who want to filter by specific location)
    if (location && userRole === 'admin') {
      query.location = { $regex: escapeRegex(location), $options: "i" };
    }

    console.log(`🔍 Final query:`, JSON.stringify(query, null, 2));

    const results = await Consultation.find(query).sort({ createdAt: -1 });
    
    console.log(`📊 Returning ${results.length} consultation records`);
    res.json(results);
  } catch (error) {
    console.error("Error filtering consultations:", error.message);
    res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
