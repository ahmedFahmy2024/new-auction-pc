// controllers/contactController.js
const asyncHandler = require("express-async-handler");
const Contact = require("../models/contactModel");
const ApiError = require("../utils/ApiError");
const ApiFeatures = require("../utils/ApiFeatures");

// @desc    Get all contacts
// @route   GET /api/v1/contacts
// @access  Private
exports.getContacts = asyncHandler(async (req, res) => {
  const filterObject = {};
  // if (req.params.projectId) filterObject = { project: req.params.projectId };

  // First, apply filtering and search
  const apiFeatures = new ApiFeatures(Contact.find(filterObject), req.query)
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
  const contacts = await mongooseQuery;

  res.status(200).json({
    success: true,
    results: contacts.length,
    paginationResult,
    data: contacts,
  });
});

// @desc    Get single contact
// @route   GET /api/v1/contacts/:id
// @access  Private
exports.getSingleContact = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const contact = await Contact.findById(id);

  if (!contact) {
    return next(new ApiError(`No contact with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: contact,
  });
});

// @desc    Create contact
// @route   POST /api/v1/contacts
// @access  Private
exports.createContact = asyncHandler(async (req, res) => {
  // if (!req.body.project) {
  //   req.body.project = req.params.projectId;
  // }

  const contact = await Contact.create(req.body);

  res.status(201).json({
    success: true,
    data: contact,
  });
});

// @desc    Update contact
// @route   PUT /api/v1/contacts/:id
// @access  Private
exports.updateContact = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const contact = await Contact.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!contact) {
    return next(new ApiError(`No contact with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: contact,
  });
});

// @desc    Delete contact
// @route   DELETE /api/v1/contact/:id
// @access  Private
exports.deleteContact = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const contact = await Contact.findByIdAndDelete(id);

  if (!contact) {
    return next(new ApiError(`No contact with id: ${id}`, 404));
  }

  res.status(204).send();
});
