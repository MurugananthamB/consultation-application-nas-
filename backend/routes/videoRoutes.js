const express = require("express");
const router = express.Router();
const {
  streamVideo,
  getFilteredVideos,
} = require("../controllers/videoController");

// Updated route with date param
router.get("/videos/:date/:filename", streamVideo);

// 🔍 New route for filtering video metadata
router.get("/videos/filter", getFilteredVideos);

module.exports = router;
