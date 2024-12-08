// models/projectModel.js
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxLength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
      trim: true,
    },
    imageCover: String,
    images: [String],
    file: String,
    city: {
      type: String,
      trim: true,
    },
    location: String,
    dateStart: {
      type: Date,
      required: [true, "Start date is required"],
    },
    auctionStartTime: {
      type: String,
      required: [true, "Auction start time is required"],
      validate: {
        validator: function (v) {
          // Validate time format (HH:MM) using regex
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid time format! Please use HH:MM format (e.g., 4:30 or 16:30)`,
      },
    },
    status: {
      type: String,
      enum: {
        values: ["upcoming", "ongoing", "completed"],
        message: "Status must be either: upcoming, ongoing, completed",
      },
      default: "upcoming",
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    playButton: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Function to set status based on current date and auction time
projectSchema.pre("save", function (next) {
  // Only run status calculation if dateStart or auctionStartTime has changed
  if (!this.isModified("dateStart") && !this.isModified("auctionStartTime")) {
    return next();
  }

  const currentDateTime = new Date();

  // Combine dateStart and auctionStartTime into a Date object
  const [hours, minutes] = this.auctionStartTime.split(":").map(Number);
  const auctionStartDateTime = new Date(this.dateStart);
  auctionStartDateTime.setHours(hours, minutes);

  // Check conditions to update status
  if (currentDateTime < auctionStartDateTime) {
    this.status = "upcoming";
  } else if (currentDateTime >= auctionStartDateTime) {
    this.status = "ongoing";
  } else {
    this.status = "completed";
  }

  next();
});

const setImageURL = (doc) => {
  // Check if the URL is already complete
  const isFullUrl = (url) =>
    url.startsWith("http://") || url.startsWith("https://");

  if (doc.imageCover && !isFullUrl(doc.imageCover)) {
    doc.imageCover = `${process.env.BASE_URL}/projects/${doc.imageCover}`;
  }

  if (doc.file && !isFullUrl(doc.file)) {
    doc.file = `${process.env.BASE_URL}/projects/${doc.file}`;
  }

  if (doc.images) {
    doc.images = doc.images.map((image) =>
      isFullUrl(image) ? image : `${process.env.BASE_URL}/projects/${image}`
    );
  }
};

projectSchema.post("init", (doc) => {
  setImageURL(doc);
});

projectSchema.post("save", (doc) => {
  setImageURL(doc);
});

const ProjectModel = mongoose.model("Project", projectSchema);

module.exports = ProjectModel;
