const express = require("express");
const router = express.Router();
const {
  streamVideo,
  getFilteredVideos,
} = require("../controllers/videoController");
const { protect } = require("../middleware/auth");

// Updated route with date param (requires authentication)
router.get("/videos/:date/:filename", protect, streamVideo);

// 🔍 New route for filtering video metadata (requires authentication)
router.get("/videos/filter", protect, getFilteredVideos);

module.exports = router;
