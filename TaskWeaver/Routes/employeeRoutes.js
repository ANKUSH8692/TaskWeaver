
import express from 'express';
import Employee from '../models/employee.model.js';
import { verifyJWT, requireAdmin } from '../middleware/Auth.middleware.js';

const router = express.Router();

// Get all employees
router.get('/', verifyJWT, requireAdmin, async (req, res) => {
    try {
        const {
            search,
            department,
            role,
            page = 1,
            limit = 10
        } = req.query;
        const filter = {};

        if (search) {
            filter.$or = [
                { employeename: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        }
        if (department) {
            filter.department = department;
        }

        if (role) {
            filter.role = role;
        }

        // Manual pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const employees = await Employee.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Employee.countDocuments(filter);

        res.json({
            success: true,
            message: 'Employees fetched successfully',
            data: {
                employees,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
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
        if (req.employee.role !== 'admin' && req.employee._id.toString() !== req.params.id) {
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
    try {
        const id = req.params.id;
        const updateData = req.body;

        // Check permissions first
        if (req.employee.role !== 'admin' && req.employee._id.toString() !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        if (req.body.role && req.employee.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Only admin can update role"
            });
        }

        const employee = await Employee.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: employee
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

router.delete('/:id', verifyJWT, requireAdmin, async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Employee deleted successfully",
            data: employee
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
