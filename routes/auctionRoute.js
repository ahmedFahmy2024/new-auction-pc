// routes/auctionRoute.js
const express = require("express");
const {
  uploadAuctionImage,
  resizeImages,
  getAuctions,
  getSingleAuction,
  createAuction,
  updateAuction,
  deleteAuction,
  toggleAuctionRunning,
  toggleDisplayField,
} = require("../controllers/auctionController");
const pricesRoute = require("./priceRoute");

const router = express.Router({ mergeParams: true });

router.use("/:auctionId/prices", pricesRoute);

router
  .route("/")
  .get(getAuctions)
  .post(uploadAuctionImage, resizeImages, createAuction);
router
  .route("/:id")
  .get(getSingleAuction)
  .put(uploadAuctionImage, resizeImages, updateAuction)
  .delete(deleteAuction);

router.patch("/:id/toggle-running", toggleAuctionRunning);
router.patch("/:id/toggle-display/:fieldName", toggleDisplayField);

module.exports = router;
