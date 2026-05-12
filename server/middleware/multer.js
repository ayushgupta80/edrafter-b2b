const multer = require('multer');
const path = require('path');

const generateShortId = require('ssid');

// Set storage engine
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function (req, file, cb) {
    const customLengthShortIdWithoutSymbols = generateShortId(12, false);
    const parsed = path.parse(file.originalname);
    const newFilename = `${parsed.name}-${customLengthShortIdWithoutSymbols}${parsed.ext}`;

    console.log('File name:', newFilename); // Log the new filename for debugging

    cb(null, `${file.fieldname}-${newFilename}`);
  }
});

// Initialize multer for multiple file uploads
const uploadMulter = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max file size of 5MB per file
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
}).array('files', 1000); 

// Check file type (images only)
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images and PDFs Only!');
  }
};

module.exports = { storage, uploadMulter };
