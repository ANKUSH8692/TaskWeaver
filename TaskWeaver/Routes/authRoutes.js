import express from 'express';
import Employee from '../models/employee.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cloudinary from '../db/cloudinary.js';
import multerSorage from "../middleware/multer.middleware.js";
import { verifyJWT } from '../middleware/Auth.middleware.js';
import { ApiError } from '../utils/ApiError.js';

const router = express.Router();

const tokenGenerator = (employeeId) => {
    return jwt.sign({ _id: employeeId }, process.env.ACCESS_TOKEN_SECRET||"hi", { expiresIn: '1d' });
}

router.post('/register', multerSorage.single('profile_picture'),async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            employeename,
            email,
            password,
            department,
            position,
        } = req.body;

        if ([firstName, lastName, employeename, email, password].some((field) => !field.trim() === "")) {
            throw new ApiError(400, "All fields are required");
        }

        const existingEmployee = await Employee.findOne({
            $or: [{ employeename }, { email }]
        });

        if (existingEmployee) {
            throw new ApiError(409, "Employeename or email already in use");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Parse skills with null check
        const skills = req.body.skills ? req.body.skills.split(',').map((skill) => skill.trim()).filter((skill) => skill !== "") : [];
        
        let profilePictureUrl = "";
        if (req.file) {
            try {
                const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
                const uploadResult = await cloudinary.uploader.upload(dataUri, {
                    folder: 'TaskWeaver-Profiles',
                    format: 'webp'
                });
                profilePictureUrl = uploadResult.secure_url;
            } catch (err) {
                throw new ApiError(500, "Image upload failed");
            }
        }
        
        const newEmployee = new Employee({
            firstName,
            lastName,
            employeename,
            email,
            password: hashedPassword,
            profile_picture: profilePictureUrl,
            role: 'employee',
            department,
            DateOfJoining: new Date(),
            position,
            skills
        });

        const savedEmployee = await newEmployee.save();
        const accessToken = tokenGenerator(savedEmployee._id);

        res.status(201).json({
            success: true,
            message: "Employee registered successfully",
            data: {
                _id: savedEmployee._id,
                employeename: savedEmployee.employeename,
                email: savedEmployee.email,
                role: savedEmployee.role||'employee',
                DateOfJoining:new Date(),
                accessToken
            }
        })
    } catch (error) {
        throw new ApiError(error?.statusCode || 500, error?.message || "Internal Server Error");
    }
})

router.post('/login', async (req, res) => {
    try {

        const { email, password } = req.body;


        if(!email || !password){
            throw new ApiError("401","email or username and password required");
        }
        const employee = await Employee.findOne({
            $or: [{ employeename: email }, { email: email }]
        });
        if (!employee) {
            throw new ApiError(401, "Invalid employeename or password");
        }

        const isPasswordValid = await bcrypt.compare(password, employee.password);

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid employeename or password");
        }
        const accessToken = tokenGenerator(employee._id);
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                _id: employee._id,
                employeename: employee.employeename,
                email: employee.email,
                role: employee.role,
                accessToken
            }
        })

    } catch (error) {
        throw new ApiError(error?.statusCode || 500, error?.message || "Internal Server Error");
    }
});

router.get('/me', verifyJWT, async (req, res) => {
    try {
        const employeeId = req.employee._id;
        const employee = await Employee.findById(employeeId).select('-password');           
        if (!employee) {
            throw new ApiError(404, "Employee not found");
        }
        res.status(200).json({
            success: true,
            data: employee
        });
    }
    catch (error) {
        throw new ApiError(error?.statusCode || 500, error?.message || "Internal Server Error");
    }
});

router.put('/profile', verifyJWT, async (req, res) => {
    try {
        const employeeId = req.employee._id;
        const updateData = req.body;

        const updatedEmployee = await Employee.findByIdAndUpdate(employeeId, updateData, { new: true }).select('-password');
        if (!updatedEmployee) {
            throw new ApiError(404, "Employee not found");
        }
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedEmployee
        });
    }
    catch (error) {
        throw new ApiError(error?.statusCode || 500, error?.message || "Internal Server Error");
    }
});

export default router;