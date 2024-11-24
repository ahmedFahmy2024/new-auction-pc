// routes/projectRoute.js
const express = require("express");
const {
  getBanners,
  uploadBannerImage,
  resizeImages,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../controllers/bannerControler");

const router = express.Router();

router
  .route("/")
  .get(getBanners)
  .post(uploadBannerImage, resizeImages, createBanner);
router
  .route("/:id")
  .get(getBanner)
  .put(uploadBannerImage, resizeImages, updateBanner)
  .delete(deleteBanner);

module.exports = router;
