// models/projectModel.js
const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema(
  {
    auctionName: {
      type: String,
      required: [true, "Auction name is required"],
      trim: true,
    },
    itemImg: String,
    logoOne: String,
    logoSecond: String,
    logoThird: String,
    imageCover: String,
    images: [String],
    bgImage: String,
    videoUrl: String,
    bgColor: String,
    textColor: String,
    notesColor: String,
    textBgColor1: String,
    textBgColor2: String,
    textBgColor3: String,
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Associated project is required"],
    },
    openPrice: String,
    seekingPercent: String,
    taxPercent: String,
    areaPrice: String,
    area: String,
    notes1: String,
    notes2: String,
    isRunning: {
      type: Boolean,
      default: false,
    },
    displayLogoOne: {
      type: Boolean,
      default: true,
    },
    displayLogoSecond: {
      type: Boolean,
      default: true,
    },
    displayLogoThird: {
      type: Boolean,
      default: true,
    },
    displayAreaPrice: {
      type: Boolean,
      default: true,
    },
    displayArea: {
      type: Boolean,
      default: true,
    },
    displayOpenPrice: {
      type: Boolean,
      default: true,
    },
    displaySeekingPercent: {
      type: Boolean,
      default: true,
    },
    displayIncrease: {
      type: Boolean,
      default: true,
    },
    displayTaxPercent: {
      type: Boolean,
      default: true,
    },
    displayNotes1: {
      type: Boolean,
      default: true,
    },
    displayNotes2: {
      type: Boolean,
      default: true,
    },
    displayVideoUrl: {
      type: Boolean,
      default: true,
    },
    displayBgImage: {
      type: Boolean,
      default: true,
    },
    minIncrese: String,
    itemName: String,
  },
  {
    timestamps: true,
  }
);

const setImageURL = (doc) => {
  // Check if the URL is already complete
  const isFullUrl = (url) =>
    url.startsWith("http://") || url.startsWith("https://");

  if (doc.logoOne && !isFullUrl(doc.logoOne)) {
    const imageURL = `${process.env.BASE_URL}/auctions/${doc.logoOne}`;
    doc.logoOne = imageURL;
  }

  if (doc.logoSecond && !isFullUrl(doc.logoSecond)) {
    const imageURL = `${process.env.BASE_URL}/auctions/${doc.logoSecond}`;
    doc.logoSecond = imageURL;
  }
  if (doc.logoThird && !isFullUrl(doc.logoThird)) {
    const imageURL = `${process.env.BASE_URL}/auctions/${doc.logoThird}`;
    doc.logoThird = imageURL;
  }

  if (doc.imageCover && !isFullUrl(doc.imageCover)) {
    const imageURL = `${process.env.BASE_URL}/auctions/${doc.imageCover}`;
    doc.imageCover = imageURL;
  }

  if (doc.itemImg && !isFullUrl(doc.itemImg)) {
    const imageURL = `${process.env.BASE_URL}/auctions/${doc.itemImg}`;
    doc.itemImg = imageURL;
  }

  if (doc.bgImage && !isFullUrl(doc.bgImage)) {
    const imageURL = `${process.env.BASE_URL}/auctions/${doc.bgImage}`;
    doc.bgImage = imageURL;
  }

  // Handle multiple images array with the same pattern
  if (doc.images && Array.isArray(doc.images)) {
    doc.images = doc.images.map((image) => {
      if (image && !isFullUrl(image)) {
        return `${process.env.BASE_URL}/auctions/${image}`;
      }
      return image;
    });
  }
};

auctionSchema.post("init", (doc) => {
  setImageURL(doc);
});

auctionSchema.post("save", (doc) => {
  setImageURL(doc);
});

const AuctionModel = mongoose.model("Auction", auctionSchema);

module.exports = AuctionModel;
