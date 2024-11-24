// controllers/projectController.js
const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

const ApiFeatures = require("../utils/ApiFeatures");
const ApiError = require("../utils/ApiError");
const Banner = require("../models/bannerModel");
const { uploadMixOfImages } = require("../middlewares/uploadImageMiddleware");

// upload multiple images
exports.uploadBannerImage = uploadMixOfImages([
  { name: "imageCover", maxCount: 1 },
]);

// image processing
exports.resizeImages = asyncHandler(async (req, res, next) => {
  // image processing for imageCover
  if (req.files.imageCover) {
    const imageBuffer = req.files.imageCover[0].buffer;
    const metadata = await sharp(imageBuffer).metadata();
    const imageFormat = metadata.format || "png";
    const imageCoverfieldName = `banner-${uuidv4()}-${Date.now()}-imageCover.${imageFormat}`;

    await sharp(imageBuffer)
      .toFormat(imageFormat)
      .toFile(`uploads/banners/${imageCoverfieldName}`);

    req.body.imageCover = imageCoverfieldName;
  }

  next();
});

// @desc    Get list of banners
// @route   GET /api/v1/banners
// @access  Public
exports.getBanners = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.filterObject) {
    filter = req.filterObject;
  }

  // First, apply filtering and search
  const apiFeatures = new ApiFeatures(Banner.find(filter), req.query)
    .filter()
    .search()
    .sort()
    .limitFields();

  // Get the count of documents after filtering
  const filteredQuery = apiFeatures.mongooseQuery.clone();
  const filteredCount = await filteredQuery.countDocuments();

  // Then apply pagination
  apiFeatures.paginate(filteredCount);

  // Execute query
  const { mongooseQuery, paginationResult } = apiFeatures;
  const banners = await mongooseQuery;

  res.status(200).json({
    success: true,
    results: banners.length,
    paginationResult,
    data: banners,
  });
});

// @desc    Get specific banner by id
// @route   GET /api/v1/banners/:id
// @access  Public
exports.getBanner = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const banner = await Banner.findById(id);

  if (!banner) {
    return next(new ApiError(`No banner found for id ${id}`, 404));
  }

  res.status(200).json({
    status: "success",
    data: banner,
  });
});

// @desc    Create banner
// @route   POST /api/v1/banners
// @access  Private/Admin
exports.createBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.create(req.body);

  res.status(201).json({
    status: "success",
    data: banner,
  });
});

// @desc    Update specific banner
// @route   PUT /api/v1/banners/:id
// @access  Private/Admin
exports.updateBanner = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const banner = await Banner.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!banner) {
    return next(new ApiError(`No banner found for id ${id}`, 404));
  }

  // Trigger "save" event for image processing middleware
  banner.save();

  res.status(200).json({
    status: "success",
    data: banner,
  });
});

// @desc    Delete specific banner
// @route   DELETE /api/v1/banners/:id
// @access  Private/Admin
exports.deleteBanner = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const banner = await Banner.findByIdAndDelete(id);

  if (!banner) {
    return next(new ApiError(`No banner found for id ${id}`, 404));
  }

  res.status(204).send();
});
