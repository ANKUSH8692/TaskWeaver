import express from 'express';
import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cloudinary from '../db/cloudinary.js';
import multerSorage from "../middleware/multer.middleware.js"
import { ApiError } from '../utils/ApiError.js';

const router = express.Router();

const tokenGenerator = (userId) => {
    return jwt.sign({ _id: userId }, process.env.ACCESS_TOKEN_SECRET||"hi", { expiresIn: '1d' });
}

router.post('/register', multerSorage.single('profile_picture'),async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            username,
            email,
            password,
            department,
            position,
        } = req.body;

        if ([firstName, lastName, username, email, password].some((field) => !field.trim() === "")) {
            throw new ApiError(400, "All fields are required");
        }

        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            throw new ApiError(409, "Username or email already in use");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const skills = req.body.skills.split(',').map((skill) => skill.trim()).filter((skill) => skill !== "");
        const image = req.body.profile_picture;
        
        let profilePicturePath="https://drive.google.com/file/d/1AHSHwtmStNIcEzCsRrKkXOqA2Lbi_dVT/view?usp=sharing";
        if(image){
            const dataUri = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
            
            try{
                profilePicturePath = await cloudinary.uploader.upload(dataUri, {
              folder: 'Chat-Box',
              format: 'webp'
            });
            }catch(err){
                throw new ApiError(500, "Image upload failed");
            }
            console.log(profilePicturePath);
            
        }
        
        const newUser = new User({
            firstName,
            lastName,
            username,
            email,
            password: hashedPassword,
            profile_picture:profilePicturePath.secure_url,
            role:'user',
            department,
            DateOfJoining:new Date(),
            position,
            skills
        });

        const savedUser = await newUser.save();
        const accessToken = tokenGenerator(savedUser._id);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                _id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
                role: savedUser.role||'user',
                DateOfJoining:new Date(),
                accessToken
            }
        })
    } catch (error) {
        throw new ApiError(error?.statusCode || 500, error?.message || "Internal Server Error");
    }
})

router.post('login', async (req, res) => {
    try {
        const { find_user, password } = req.body;

        if ([find_user, password].some((field) => !field.trim() === "")) {
            throw new ApiError(400, "All fields are required");
        }
        const user = await User.findOne({
            $or: [{ username: find_user }, { email: find_user }]
        });
        if (!user) {
            throw new ApiError(401, "Invalid username or password");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid username or password");
        }
        const accessToken = tokenGenerator(user._id);
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                accessToken
            }
        })

    } catch (error) {
        throw new ApiError(error?.statusCode || 500, error?.message || "Internal Server Error");
    }
});

export default router;