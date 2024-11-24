// models/bannerModel.js
const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  { imageCover: String },
  { timestamps: true }
);

const setImageURL = (doc) => {
  // Check if the URL is already complete
  const isFullUrl = (url) =>
    url.startsWith("http://") || url.startsWith("https://");

  if (doc.imageCover && !isFullUrl(doc.imageCover)) {
    doc.imageCover = `${process.env.BASE_URL}/banners/${doc.imageCover}`;
  }
};

bannerSchema.post("init", (doc) => {
  setImageURL(doc);
});

bannerSchema.post("save", (doc) => {
  setImageURL(doc);
});

const BannerModel = mongoose.model("Banner", bannerSchema);

module.exports = BannerModel;
