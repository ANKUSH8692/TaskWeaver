import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRouter from "./Routes/authRoutes.js";
import EmployeeRouter from "./Routes/employeeRoutes.js";
import TaskRouter from "./Routes/taskRoutes.js";
import TaskAssignmentLog from "./Routes/assignmentLogsRoutes.js";

const app=express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cors())

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// app.use('/api/v1/auth', limiter);
// app.use('/api/v1/employees', limiter);
// app.use('/api/v1/tasks', limiter);
// app.use('/api/v1/assignments', limiter);

app.get("/api/v1/test",(req,res)=>{
    const hi = req.body.hi;
    res.status(200).json({
        success:true,
        message:"API is working fine",
        data:hi
    });
})
app.use('/api/v1/auth',authRouter);
app.use('/api/v1/employees',EmployeeRouter);
app.use('/api/v1/tasks',TaskRouter);
app.use('/api/v1/assignments',TaskAssignmentLog);

export {app};