// controllers/projectController.js
const fs = require("fs");
const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

const ApiFeatures = require("../utils/ApiFeatures");
const ApiError = require("../utils/ApiError");
const Project = require("../models/projectModel");
const { uploadMixOfImages } = require("../middlewares/uploadImageMiddleware");

// upload multiple images
exports.uploadProjectImage = uploadMixOfImages([
  { name: "imageCover", maxCount: 1 },
  { name: "file", maxCount: 1 },
  { name: "images", maxCount: 5 },
]);

// image processing
exports.resizeImages = asyncHandler(async (req, res, next) => {
  // image processing for imageCover
  if (req.files.imageCover) {
    const imageBuffer = req.files.imageCover[0].buffer;
    const metadata = await sharp(imageBuffer).metadata();
    const imageFormat = metadata.format || "png";
    const imageCoverfieldName = `project-${uuidv4()}-${Date.now()}-imageCover.${imageFormat}`;

    await sharp(imageBuffer)
      .toFormat(imageFormat)
      .toFile(`uploads/projects/${imageCoverfieldName}`);

    req.body.imageCover = imageCoverfieldName;
  }

  // image processing for images
  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (image, index) => {
        // Get image format using sharp metadata
        const metadata = await sharp(image.buffer).metadata();
        const imageFormat = metadata.format || "jpeg"; // Default to 'jpeg' if format is not determined

        const imageName = `project-${uuidv4()}-${Date.now()}-image-${index + 1}.${imageFormat}`;

        await sharp(image.buffer)
          .toFormat(imageFormat)
          .toFile(`uploads/projects/${imageName}`);

        req.body.images.push(imageName);
      })
    );
  }

  // Handling PDF file
  if (req.files.file) {
    const pdfFileName = `project-${uuidv4()}-${Date.now()}.pdf`;
    const pdfBuffer = req.files.file[0].buffer;

    // Save PDF file directly
    fs.writeFileSync(`uploads/projects/${pdfFileName}`, pdfBuffer);
    req.body.file = pdfFileName;
  }

  next();
});

// @desc    Get list of projects
// @route   GET /api/v1/projects
// @access  Public
exports.getProjects = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.filterObject) {
    filter = req.filterObject;
  }

  // First, apply filtering and search
  const apiFeatures = new ApiFeatures(Project.find(filter), req.query)
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
  const projects = await mongooseQuery;

  res.status(200).json({
    success: true,
    results: projects.length,
    paginationResult,
    data: projects,
  });
});

// @desc    Get specific project by id
// @route   GET /api/v1/projects/:id
// @access  Public
exports.getProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const project = await Project.findById(id);

  if (!project) {
    return next(new ApiError(`No project found for id ${id}`, 404));
  }

  res.status(200).json({
    status: "success",
    data: project,
  });
});

// @desc    Create project
// @route   POST /api/v1/projects
// @access  Private/Admin
exports.createProject = asyncHandler(async (req, res) => {
  const project = await Project.create(req.body);

  res.status(201).json({
    status: "success",
    data: project,
  });
});

// @desc    Update specific project
// @route   PUT /api/v1/projects/:id
// @access  Private/Admin
exports.updateProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const project = await Project.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!project) {
    return next(new ApiError(`No project found for id ${id}`, 404));
  }

  // Trigger "save" event for image processing middleware
  project.save();

  res.status(200).json({
    status: "success",
    data: project,
  });
});

// @desc    Delete specific project
// @route   DELETE /api/v1/projects/:id
// @access  Private/Admin
exports.deleteProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const project = await Project.findByIdAndDelete(id);

  if (!project) {
    return next(new ApiError(`No project found for id ${id}`, 404));
  }

  res.status(204).send();
});

//  @desc    Update project status
// @route   PATCH /api/v1/projects/:id/status
// @access  Private/Admin
exports.updateProjectStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  // Create update object
  const updateData = { status };

  // If status is being changed to 'ongoing', update dateStart and auctionStartTime
  if (status === "ongoing") {
    // Set dateStart to today's date
    updateData.dateStart = new Date();

    // Set auctionStartTime to current time in HH:MM format
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    updateData.auctionStartTime = `${hours}:${minutes}`;
  }

  const project = await Project.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!project) {
    return next(new ApiError(`No project found for id ${id}`, 404));
  }

  res.status(200).json({
    status: "success",
    data: project,
  });
});

// @desc    Toggle project publication status
// @route   PATCH /api/v1/projects/:id/toggle-publish
// @access  Private/Admin
exports.toggleProjectPublication = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const project = await Project.findById(id);

  if (!project) {
    return next(new ApiError(`No project found for id ${id}`, 404));
  }

  project.isPublished = !project.isPublished;
  await project.save();

  res.status(200).json({
    status: "success",
    data: project,
  });
});
