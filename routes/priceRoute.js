// routes/auctionRoute.js
const express = require("express");
const {
  getPrices,
  createPrice,
  getSinglePrice,
  updatePrice,
  deletePrice,
} = require("../controllers/priceController");

const router = express.Router({ mergeParams: true });

router.route("/").get(getPrices).post(createPrice);
router.route("/:id").get(getSinglePrice).put(updatePrice).delete(deletePrice);

module.exports = router;
