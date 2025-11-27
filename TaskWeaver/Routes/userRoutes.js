
import express from 'express';
import Employee from '../models/employee.model.js';
import { verifyJWT, requireAdmin } from '../middleware/Auth.middleware.js';

const router = express.Router();

// Get all employees
router.get('/', verifyJWT, requireAdmin, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            department,
            role
        } = req.query;
        const filter = { isActive: true };

        if (search) {
            filter.$or = [
                { employeename: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { 'profile.firstName': { $regex: search, $options: 'i' } },
                { 'profile.lastName': { $regex: search, $options: 'i' } }
            ];
        }
        if (department) {
            filter.department = department;
        }

        if (role) {
            filter.role = role;
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            select: '-password' // Exclude password field
        };
        const employees = await Employee.paginate(filter, options);

        res.json({
            success: true,
            message: 'Employees fetched successfully',
            data: employees
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/:id', verifyJWT, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id).select('-password');
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }
        if(req.employee.role !== 'admin' && req.employee.employeeId !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }
        res.status(200).json({
            success: true,
            data: employee
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.post('/update-profile/:id', verifyJWT, async (req, res) => {
    try{
        const id=req.params.id;
        const updateData=req.body;
        if(req.body.role && req.employee.role!=='admin'){
            return res.status(403).json({
                success: false,
                message: "Only admin can update role"
            });
        }

        const employee=await Employee.findByIdAndUpdate(id,updateData,{new:true}).select('-password');
        if(!employee){
            return  res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }
        if(req.employee.role !== 'admin' && req.employee.employeeId !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: employee
        });

    }catch(err){
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

router.delete('/:id', verifyJWT, requireAdmin, async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(req.params.id,{ new: true });
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Employee deactivated successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


router.get('/stats/overview', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    const adminEmployees = await Employee.countDocuments({ role: 'admin', isActive: true });
    const employeeEmployees = await Employee.countDocuments({ role: 'employee', isActive: true });
    
    // Get employees by department
    const employeesByDepartment = await Employee.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    // Get recent registrations (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentRegistrations = await Employee.countDocuments({
      isActive: true,
      createdAt: { $gte: oneWeekAgo }
    });

    res.json({
      success: true,
      message: 'Employee statistics fetched successfully',
      data: {
        totalEmployees,
        adminEmployees,
        employeeEmployees,
        employeesByDepartment,
        recentRegistrations
      }
    });

  } catch (error) {
    console.error('Get employee stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching employee statistics'
    });
  }
});

router.get('/department/:department', verifyJWT, async (req, res) => {
  try {
    const { department } = req.params;
    
    const employees = await Employee.find({ 
      department,
      isActive: true 
    }).select('-password').sort({ 'profile.firstName': 1 });

    res.json({
      success: true,
      message: `Employees in ${department} department fetched successfully`,
      data: employees,
      count: employees.length
    });

  } catch (error) {
    console.error('Get employees by department error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching employees by department'
    });
  }
});

export default router;
