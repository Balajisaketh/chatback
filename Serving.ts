import multer from 'multer';

// Create a storage engine
export const storage = multer.diskStorage({
  destination: (req:any, file:any, cb) => {
    cb(null, 'uploads'); // Set the destination folder for uploaded images
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Set the filename for the uploaded image
  },
});

// Create the Multer instance
const upload = multer({ storage, limits: {
  fileSize: 1024 * 1024 * 8, // Set the maximum file size (e.g., 5MB)
}, });

export default upload;

