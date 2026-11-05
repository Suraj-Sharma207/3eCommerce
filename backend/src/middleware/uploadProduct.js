import multer from "multer";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const uploadProduct = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 10, // max 10 images at once
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error(
        `Invalid file type: ${file.mimetype}. Allowed: JPG, JPEG, PNG, WEBP`,
      );
      err.statusCode = 400;
      cb(err, false);
    }
  },
});

export default uploadProduct;
