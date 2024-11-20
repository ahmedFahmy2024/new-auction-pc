// routes/projectRoute.js
const express = require("express");
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  uploadProjectImage,
  resizeImages,
  updateProjectStatus,
  toggleProjectPublication,
} = require("../controllers/projectController");
const auctionsRoute = require("./auctionRoute");

const router = express.Router();

router.use("/:projectId/auctions", auctionsRoute);

router
  .route("/")
  .get(getProjects)
  .post(uploadProjectImage, resizeImages, createProject);
router
  .route("/:id")
  .get(getProject)
  .put(uploadProjectImage, resizeImages, updateProject)
  .delete(deleteProject);

router.patch("/:id/status", updateProjectStatus);
router.patch("/:id/toggle-publish", toggleProjectPublication);

module.exports = router;
