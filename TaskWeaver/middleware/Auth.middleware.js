import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken"
import Employee  from "../models/employee.model.js";

export const verifyJWT = async(req, res, next) => {
    try {
        const token = req.localStorage?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const employee = await Employee.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!employee) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.employee = employee;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
}

export const requireAdmin = (req, res, next) => {
  if (req.employee.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};
