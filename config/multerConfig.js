const multer = require('multer');

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/product-images/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  },
});

// Function to filter file uploads to allow only images
const fileFilter = function (req, file, cb) {
  // Check if the file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('File is not an image!'), false); // Reject the file
  }
};



const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter // Apply the file filter
});
module.exports = upload;
