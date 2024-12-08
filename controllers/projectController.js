// controllers/projectController.js
const fs = require("fs");
const util = require("util");

const writeFile = util.promisify(fs.writeFile);
const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

const ApiFeatures = require("../utils/ApiFeatures");
const ApiError = require("../utils/ApiError");
const Project = require("../models/projectModel");
const { uploadMixOfImages } = require("../middlewares/uploadImageMiddleware");

// Allowed file types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"];

// upload multiple images
exports.uploadProjectImage = uploadMixOfImages([
  { name: "imageCover", maxCount: 1 },
  { name: "file", maxCount: 1 },
  { name: "images", maxCount: 5 },
]);

// Helper function to process non-GIF images
const processNonGifImage = async (buffer, format) =>
  sharp(buffer).toFormat(format).toBuffer();

// Helper function to save file
const saveFile = (buffer, filepath) => writeFile(filepath, buffer);

// Helper function to validate file type
const validateFileType = (mimetype, allowedTypes) => {
  if (!allowedTypes.includes(mimetype)) {
    throw new ApiError(
      400,
      `Invalid file type. Allowed types are: ${allowedTypes.join(", ")}`
    );
  }
  return true;
};

// Helper function to handle file saving
const handleFileUpload = async (file, folder) => {
  validateFileType(file.mimetype, ALLOWED_FILE_TYPES);

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  const isPDF = file.mimetype === "application/pdf";

  let fileExtension = "";

  if (isPDF) {
    fileExtension = "pdf";
  } else if (isImage) {
    const mimeType = file.mimetype.split("/")[1];
    fileExtension = mimeType === "jpeg" ? "jpg" : mimeType;
  }

  const fileName = `project-${uuidv4()}-${Date.now()}.${fileExtension}`;
  const outputPath = `uploads/${folder}/${fileName}`;

  if (isPDF) {
    // Save PDF directly
    await saveFile(file.buffer, outputPath);
  } else if (isImage) {
    // Handle image processing
    const metadata = await sharp(file.buffer).metadata();
    const originalFormat = metadata.format;

    if (originalFormat === "gif") {
      // Save GIF directly without processing
      await saveFile(file.buffer, outputPath);
    } else {
      // Process non-GIF images
      const processedBuffer = await processNonGifImage(
        file.buffer,
        originalFormat || "jpeg"
      );
      await saveFile(processedBuffer, outputPath);
    }
  }

  return fileName;
};

exports.resizeImages = asyncHandler(async (req, res, next) => {
  // image processing for imageCover
  if (req.files.imageCover) {
    const file = req.files.imageCover[0];
    validateFileType(file.mimetype, ALLOWED_IMAGE_TYPES);
    req.body.imageCover = await handleFileUpload(file, "projects");
  }

  // image processing for images
  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (image) => {
        validateFileType(image.mimetype, ALLOWED_IMAGE_TYPES);
        const fileName = await handleFileUpload(image, "projects");
        req.body.images.push(fileName);
      })
    );
  }

  // Handling file (image or PDF)
  if (req.files.file) {
    const file = req.files.file[0];
    req.body.file = await handleFileUpload(file, "projects");
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

exports.PlayButton = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Find the Project first
  const project = await Project.findById(id);

  if (!project) {
    return next(new ApiError(`No project with id: ${id}`, 404));
  }

  const updatePlay = await Project.findByIdAndUpdate(
    id,
    { playButton: !project.playButton },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: updatePlay,
  });
});
