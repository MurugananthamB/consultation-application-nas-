const fs = require("fs");
const path = require("path");
const Consultation = require("../models/Consultation");

// Load storage path configuration using environment variables
// const getStoragePath = () => {
//   // Use environment variables for Windows NAS configuration
//   const nasMountPath = process.env.NAS_MOUNT_PATH || "Z:";
//   const nasFolder = process.env.NAS_FOLDER || "Video Record";
  
//   // Construct the full NAS path
//   const fullNasPath = path.join(nasMountPath, nasFolder);
  
//   console.log('📁 VideoController NAS Mount Path (ENV):', nasMountPath);
//   console.log('📁 VideoController NAS Folder (ENV):', nasFolder);
//   console.log('📁 VideoController Full NAS Path resolved:', fullNasPath);
  
//   return fullNasPath;
// };


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
 * 📂 Get filtered consultation records
 * @route GET /api/videos?uhid=&patientName=&department=&doctorName=&dateFrom=&dateTo=
 */
exports.getFilteredVideos = async (req, res) => {
  try {
    const { dateFrom, dateTo, uhid, patientName, department, doctorName, conditionType } =
      req.query;
    const query = {};

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

    const results = await Consultation.find(query).sort({ createdAt: -1 });
    res.json(results);
  } catch (error) {
    console.error("Error filtering consultations:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
