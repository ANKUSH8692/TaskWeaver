import express from 'express';
import Employee from '../models/employee.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cloudinary from '../db/cloudinary.js';
import multerSorage from "../middleware/multer.middleware.js"
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

        const skills = req.body.skills.split(',').map((skill) => skill.trim()).filter((skill) => skill !== "");
        
        let profilePicturePath="https://drive.google.com/file/d/1AHSHwtmStNIcEzCsRrKkXOqA2Lbi_dVT/view?usp=sharing";
        if (req.file) {
            try {
                const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
                const uploadResult = await cloudinary.uploader.upload(dataUri, {
                    folder: 'Chat-Box',
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
            profile_picture:profilePicturePath.secure_url,
            role:'employee',
            department,
            DateOfJoining:new Date(),
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

router.post('login', async (req, res) => {
    try {
        const { find_employee, password } = req.body;

        if ([find_employee, password].some((field) => !field.trim() === "")) {
            throw new ApiError(400, "All fields are required");
        }
        const employee = await Employee.findOne({
            $or: [{ employeename: find_employee }, { email: find_employee }]
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

export default router;