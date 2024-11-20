// controllers/priceController.js
const asyncHandler = require("express-async-handler");

const ApiFeatures = require("../utils/ApiFeatures");
const ApiError = require("../utils/ApiError");
const Price = require("../models/priceModel");

// Get /api/v1/auctions/:auctionId/prices

// @desc    Get all prices
// @route   GET /api/v1/prices
// @access  Private
exports.getPrices = asyncHandler(async (req, res) => {
  let filterObject = {};
  if (req.params.auctionId) filterObject = { auction: req.params.auctionId };

  // First, apply filtering and search
  const apiFeatures = new ApiFeatures(Price.find(filterObject), req.query)
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
  const prices = await mongooseQuery;

  res.status(200).json({
    success: true,
    results: prices.length,
    paginationResult,
    data: prices,
  });
});

// @desc    Get single price
// @route   GET /api/v1/prices/:id
// @access  Private
exports.getSinglePrice = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const price = await Price.findById(id).populate("auction");

  if (!price) {
    return next(new ApiError(`No price with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: price,
  });
});

// @desc    Create price
// @route   POST /api/v1/prices
// @access  Private
exports.createPrice = asyncHandler(async (req, res) => {
  // if (!req.body.project) {
  //   req.body.project = req.params.projectId;
  // }

  const price = await Price.create(req.body);

  res.status(201).json({
    success: true,
    data: price,
  });
});

// @desc    Update price
// @route   PUT /api/v1/prices/:id
// @access  Private
exports.updatePrice = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const price = await Price.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!price) {
    return next(new ApiError(`No price with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: price,
  });
});

// @desc    Delete price
// @route   DELETE /api/v1/prices/:id
// @access  Private
exports.deletePrice = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const price = await Price.findByIdAndDelete(id);

  if (!price) {
    return next(new ApiError(`No price with id: ${id}`, 404));
  }

  res.status(204).send();
});
