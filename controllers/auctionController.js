// controllers/projectController.js
const fs = require("fs");

const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

const ApiFeatures = require("../utils/ApiFeatures");
const ApiError = require("../utils/ApiError");
const Auction = require("../models/auctionModel");
const { uploadMixOfImages } = require("../middlewares/uploadImageMiddleware");

// upload multiple images
exports.uploadAuctionImage = uploadMixOfImages([
  { name: "logoOne", maxCount: 1 },
  { name: "logoSecond", maxCount: 1 },
  { name: "logoThird", maxCount: 1 },
  { name: "imageCover", maxCount: 1 },
  { name: "itemImg", maxCount: 1 },
  { name: "bgImage", maxCount: 1 },
  { name: "images", maxCount: 5 },
]);

// image processing
exports.resizeImages = asyncHandler(async (req, res, next) => {
  if (req.files.logoOne) {
    const imageBuffer = req.files.logoOne[0].buffer;
    const metadata = await sharp(imageBuffer).metadata();
    const imageFormat = metadata.format || "png";
    const logoOnefieldName = `auction-${uuidv4()}-${Date.now()}-logoOne.${imageFormat}`;

    await sharp(imageBuffer)
      .toFormat(imageFormat)
      .toFile(`uploads/auctions/${logoOnefieldName}`);

    req.body.logoOne = logoOnefieldName;
  }

  if (req.files.logoSecond) {
    const imageBuffer = req.files.logoSecond[0].buffer;
    const metadata = await sharp(imageBuffer).metadata();
    const imageFormat = metadata.format || "png";
    const logoSecondfieldName = `auction-${uuidv4()}-${Date.now()}-logoSecond.${imageFormat}`;

    await sharp(imageBuffer)
      .toFormat(imageFormat)
      .toFile(`uploads/auctions/${logoSecondfieldName}`);

    req.body.logoSecond = logoSecondfieldName;
  }

  if (req.files.logoThird) {
    const imageBuffer = req.files.logoThird[0].buffer;
    const metadata = await sharp(imageBuffer).metadata();
    const imageFormat = metadata.format || "png";
    const logoThirdfieldName = `auction-${uuidv4()}-${Date.now()}-logoThird.${imageFormat}`;

    await sharp(imageBuffer)
      .toFormat(imageFormat)
      .toFile(`uploads/auctions/${logoThirdfieldName}`);

    req.body.logoThird = logoThirdfieldName;
  }

  if (req.files.itemImg) {
    const imageBuffer = req.files.itemImg[0].buffer;
    const metadata = await sharp(imageBuffer).metadata();
    const imageFormat = metadata.format || "png";
    const itemImgfieldName = `auction-${uuidv4()}-${Date.now()}-itemImg.${imageFormat}`;

    await sharp(imageBuffer)
      .toFormat(imageFormat)
      .toFile(`uploads/auctions/${itemImgfieldName}`);

    req.body.itemImg = itemImgfieldName;
  }

  if (req.files.imageCover) {
    const imageBuffer = req.files.imageCover[0].buffer;
    const metadata = await sharp(imageBuffer).metadata();
    const imageFormat = metadata.format || "png";
    const imageCoverfieldName = `auction-${uuidv4()}-${Date.now()}-imageCover.${imageFormat}`;

    await sharp(imageBuffer)
      .toFormat(imageFormat)
      .toFile(`uploads/auctions/${imageCoverfieldName}`);

    req.body.imageCover = imageCoverfieldName;
  }

  if (req.files.bgImage) {
    const imageBuffer = req.files.bgImage[0].buffer;
    const metadata = await sharp(imageBuffer).metadata();
    const imageFormat = metadata.format || "png";

    // Special handling for GIF images
    if (imageFormat === "gif") {
      // Generate filename for GIF
      const bgImagefieldName = `auction-${uuidv4()}-${Date.now()}-bgImage.gif`;

      // For GIFs, save the original file without processing
      fs.writeFileSync(`uploads/auctions/${bgImagefieldName}`, imageBuffer);

      req.body.bgImage = bgImagefieldName;
    } else {
      // Existing processing for non-GIF images
      const bgImagefieldName = `auction-${uuidv4()}-${Date.now()}-bgImage.${imageFormat}`;

      await sharp(imageBuffer)
        .toFormat(imageFormat)
        .toFile(`uploads/auctions/${bgImagefieldName}`);

      req.body.bgImage = bgImagefieldName;
    }
  }

  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (image, index) => {
        // Get image format using sharp metadata
        const metadata = await sharp(image.buffer).metadata();
        const imageFormat = metadata.format || "jpeg"; // Default to 'jpeg' if format is not determined

        const imageName = `auction-${uuidv4()}-${Date.now()}-image-${index + 1}.${imageFormat}`;

        await sharp(image.buffer)
          .toFormat(imageFormat)
          .toFile(`uploads/auctions/${imageName}`);

        req.body.images.push(imageName);
      })
    );
  }

  next();
});

// Get /api/v1/projects/:projectId/auctions

// @desc    Get all auctions
// @route   GET /api/v1/auction
// @access  Private
exports.getAuctions = asyncHandler(async (req, res) => {
  let filterObject = {};
  if (req.params.projectId) filterObject = { project: req.params.projectId };

  // First, apply filtering and search
  const apiFeatures = new ApiFeatures(Auction.find(filterObject), req.query)
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
  const auctions = await mongooseQuery;

  res.status(200).json({
    success: true,
    results: auctions.length,
    paginationResult,
    data: auctions,
  });
});

// @desc    Get single auction
// @route   GET /api/v1/auction/:id
// @access  Private
exports.getSingleAuction = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const auction = await Auction.findById(id);

  if (!auction) {
    return next(new ApiError(`No auction with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: auction,
  });
});

// @desc    Create auction
// @route   POST /api/v1/auction
// @access  Private
exports.createAuction = asyncHandler(async (req, res) => {
  // if (!req.body.project) {
  //   req.body.project = req.params.projectId;
  // }

  const auction = await Auction.create(req.body);

  res.status(201).json({
    success: true,
    data: auction,
  });
});

// @desc    Update auction
// @route   PUT /api/v1/auction/:id
// @access  Private
exports.updateAuction = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const auction = await Auction.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!auction) {
    return next(new ApiError(`No auction with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: auction,
  });
});

// @desc    Delete auction
// @route   DELETE /api/v1/auction/:id
// @access  Private
exports.deleteAuction = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const auction = await Auction.findByIdAndDelete(id);

  if (!auction) {
    return next(new ApiError(`No auction with id: ${id}`, 404));
  }

  res.status(204).send();
});

// @desc    Toggle auction running state
// @route   PATCH /api/v1/auction/:id/toggle-running
// @access  Private
exports.toggleAuctionRunning = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Find the auction first
  const auction = await Auction.findById(id);

  if (!auction) {
    return next(new ApiError(`No auction with id: ${id}`, 404));
  }

  // Start a session for the transaction
  const session = await Auction.startSession();

  try {
    await session.withTransaction(async () => {
      if (!auction.isRunning) {
        // If we're turning this auction on, turn all others off first
        await Auction.updateMany(
          {
            _id: { $ne: id }, // not equal to current auction id
            isRunning: true, // only update those that are running
          },
          { isRunning: false }
        );
      }

      // Toggle the current auction's state
      auction.isRunning = !auction.isRunning;
      await auction.save();
    });

    await session.endSession();

    res.status(200).json({
      success: true,
      data: auction,
      message: `Auction ${auction.isRunning ? "started" : "stopped"} successfully`,
    });
  } catch (error) {
    await session.endSession();
    return next(new ApiError("Error toggling auction state", 500));
  }
});

// @desc    Toggle display field
// @route   PATCH /api/v1/auction/:id/toggle-display/:fieldName
// @access  Private
exports.toggleDisplayField = asyncHandler(async (req, res, next) => {
  const { id, fieldName } = req.params;

  // Verify that the field starts with 'display'
  if (!fieldName.startsWith("display")) {
    return next(
      new ApiError('Can only toggle fields that start with "display"', 400)
    );
  }

  // Get the current auction
  const auction = await Auction.findById(id);
  if (!auction) {
    return next(new ApiError(`No auction found with id: ${id}`, 404));
  }

  // Verify the field exists in the schema
  if (!(fieldName in auction)) {
    return next(
      new ApiError(`Field "${fieldName}" not found in auction schema`, 400)
    );
  }

  // Toggle the boolean value
  const updatedAuction = await Auction.findByIdAndUpdate(
    id,
    { [fieldName]: !auction[fieldName] },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: updatedAuction,
  });
});
