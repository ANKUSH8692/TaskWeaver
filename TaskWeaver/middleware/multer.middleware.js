// middlewares/upload.js
import multer from 'multer';

// Store the file in memory. This is safer for immediate upload to Cloudinary.
const storage = multer.memoryStorage(); 

// Create the upload middleware: .single('image') MUST match formData.append('image', file)
const multerSorage = multer({ 
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024 // Security Layer 2: Server-side limit (5MB)
    },
    fileFilter: (req, file, cb) => {
        // Security Layer 3: Server-side MIME type check
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type, only images are allowed.'), false);
        }
    }
}); 

export default multerSorage;