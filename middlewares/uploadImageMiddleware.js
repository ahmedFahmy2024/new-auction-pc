// uploadImageMiddleware.js file
const multer = require("multer");
const ApiError = require("../utils/ApiError");

exports.uploadSingleImage = (fieldName) => {
  const multerStorage = multer.memoryStorage();

  const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new ApiError("Not an image! Please upload only images.", 400), false);
    }
  };

  const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
  return upload.single(fieldName);
};

exports.uploadMixOfImages = (arrayOfFields) => {
  const multerStorage = multer.memoryStorage();

  const multerFilter = (req, file, cb) => {
    if (
      file.mimetype.startsWith("image") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          "Not a valid file type! Please upload images or PDF files.",
          400
        ),
        false
      );
    }
  };

  const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
  return upload.fields(arrayOfFields);
};
