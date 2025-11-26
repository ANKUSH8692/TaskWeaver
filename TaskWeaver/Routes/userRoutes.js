
import express from 'express';
import User from '../models/user.model.js';
import { verifyJWT, requireAdmin } from '../middleware/Auth.middleware.js';

const router = express.Router();

// Get all users
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
                { username: { $regex: search, $options: 'i' } },
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
        const users = await User.paginate(filter, options);

        res.json({
            success: true,
            message: 'Users fetched successfully',
            data: users
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
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        if(req.user.role !== 'admin' && req.user.userId !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }
        res.status(200).json({
            success: true,
            data: user
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
        if(req.body.role && req.user.role!=='admin'){
            return res.status(403).json({
                success: false,
                message: "Only admin can update role"
            });
        }

        const user=await User.findByIdAndUpdate(id,updateData,{new:true}).select('-password');
        if(!user){
            return  res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        if(req.user.role !== 'admin' && req.user.userId !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: user
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
        const user = await User.findByIdAndUpdate(req.params.id,{ new: true });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "User deactivated successfully"
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
    const totalUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin', isActive: true });
    const employeeUsers = await User.countDocuments({ role: 'user', isActive: true });
    
    // Get users by department
    const usersByDepartment = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    // Get recent registrations (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentRegistrations = await User.countDocuments({
      isActive: true,
      createdAt: { $gte: oneWeekAgo }
    });

    res.json({
      success: true,
      message: 'User statistics fetched successfully',
      data: {
        totalUsers,
        adminUsers,
        employeeUsers,
        usersByDepartment,
        recentRegistrations
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user statistics'
    });
  }
});

router.get('/department/:department', verifyJWT, async (req, res) => {
  try {
    const { department } = req.params;
    
    const users = await User.find({ 
      department,
      isActive: true 
    }).select('-password').sort({ 'profile.firstName': 1 });

    res.json({
      success: true,
      message: `Users in ${department} department fetched successfully`,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('Get users by department error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users by department'
    });
  }
});

export default router;
