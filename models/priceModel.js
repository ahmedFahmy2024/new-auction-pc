// models/priceModel.js
const mongoose = require("mongoose");

const priceSchema = new mongoose.Schema(
  {
    increase: String,
    soldPrice: String,
    paddleNum: String,
    total: String,
    areaPrice: String,
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: [true, "Associated auction is required"],
    },
  },
  {
    timestamps: true,
  }
);

const PriceModel = mongoose.model("Price", priceSchema);

module.exports = PriceModel;
