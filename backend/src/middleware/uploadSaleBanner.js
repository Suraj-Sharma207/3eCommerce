import multer from 'multer';

const storage = multer.memoryStorage();

const uploadSaleBanner = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.');
      error.statusCode = 400;
      cb(error, false);
    }
  }
});

export default uploadSaleBanner;
