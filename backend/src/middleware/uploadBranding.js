import multer from 'multer';

// Use memory storage so we can validate dimensions and size before streaming to Cloudinary
const storage = multer.memoryStorage();

const uploadBranding = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB limit as per requirements
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Invalid file type. Only JPG and PNG are allowed.');
      error.statusCode = 400;
      cb(error, false);
    }
  }
});

export default uploadBranding;
