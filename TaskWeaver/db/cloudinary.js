import {v2 as cloudinary} from 'cloudinary';

try {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET   
    });
    console.log("Cloudinary connected successfully");
} catch (err) {
    console.log("Cannot "+err);
}


export default cloudinary;
