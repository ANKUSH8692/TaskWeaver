import multer from 'multer';

// Store the file in memory. This is safer for immediate upload to Cloudinary.
const storage = multer.memoryStorage(); 

// Create the upload middleware: .single('image') 
const multerSorage = multer({ 
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024 
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type, only images are allowed.'), false);
        }
    }
}); 

export default multerSorage;