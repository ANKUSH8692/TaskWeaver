import express from 'express';
import TaskAssignmentLog from '../models/TaskAssignmentLog.js';
import Task from '../models/Task.js';
import Employee from '../models/Employee.js';
import {verifyJWT,requireAdmin} from "../middleware/Auth.middleware.js"

const router = express.Router();

//get all assignment logs with sorting
router.get('/', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { taskId, assignedTo, assignedBy, status, sortBy = 'assignedAt', sortOrder = 'desc' } = req.query;


    const filter = {};

    if (taskId) {
      filter.taskId = taskId;
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    if (assignedBy) {
      filter.assignedBy = assignedBy;
    }

    if (status) {
      filter.status = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const assignmentLogs = await TaskAssignmentLog.find(filter)
      .populate('taskId', 'title priority status deadline')
      .populate('assignedTo', 'employeename profile department')
      .populate('assignedBy', 'employeename profile')
      .sort(sort);

    res.json({
      success: true,
      message: 'Assignment logs fetched successfully',
      data: assignmentLogs,
      count: assignmentLogs.length
    });

  } catch (error) {
    console.error('Get assignment logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching assignment logs'
    });
  }
});

// Get assignment log by ID
router.get('/:id', verifyJWT, async (req, res) => {
  try {
    const assignmentLog = await TaskAssignmentLog.findById(req.params.id)
      .populate('taskId', 'title description priority status deadline')
      .populate('assignedTo', 'employeename email profile department')
      .populate('assignedBy', 'employeename profile');

    if (!assignmentLog) {
      return res.status(404).json({
        success: false,
        message: 'Assignment log not found'
      });
    }

    // Check permissions
    const isInvolvedEmployee = 
      req.employee.role === 'admin' ||
      assignmentLog.assignedTo._id.toString() === req.employee.employeeId ||
      assignmentLog.assignedBy._id.toString() === req.employee.employeeId;

    if (!isInvolvedEmployee) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    res.json({
      success: true,
      message: 'Assignment log fetched successfully',
      data: assignmentLog
    });

  } catch (error) {
    console.error('Get assignment log error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment log ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching assignment log'
    });
  }
});

// Get assignment logs for a specific task
router.get('/task/:taskId', verifyJWT, async (req, res) => {
  try {

    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    if (req.employee.role === 'employee' && task.assignedTo?.toString() !== req.employee.employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const assignmentLogs = await TaskAssignmentLog.find({ taskId })
      .populate('assignedTo', 'employeename profile department')
      .populate('assignedBy', 'employeename profile')
      .sort({ assignedAt: -1 });

    res.json({
      success: true,
      message: 'Assignment logs for task fetched successfully',
      data: assignmentLogs,
      count: assignmentLogs.length
    });

  } catch (error) {
    console.error('Get assignment logs for task error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching assignment logs for task'
    });
  }
});

// Get assignment logs for a specific employee
router.get('/employee/:employeeId', verifyJWT, async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Check permissions
    if (req.employee.role === 'employee' && req.employee.employeeId !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    // Check if employee exists
    const employee = await Employee.findOne({ _id: employeeId, isActive: true });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const assignmentLogs = await TaskAssignmentLog.find({ assignedTo: employeeId })
      .populate('taskId', 'title priority status deadline')
      .populate('assignedBy', 'employeename profile')
      .sort({ assignedAt: -1 });

    res.json({
      success: true,
      message: 'Assignment logs for employee fetched successfully',
      data: assignmentLogs,
      count: assignmentLogs.length
    });

  } catch (error) {
    console.error('Get assignment logs for employee error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching assignment logs for employee'
    });
  }
});

// Create assignment log
router.post('/register', verifyJWT, async (req, res) => {
  try {
    const {
      taskId,
      assignedTo,
      reason,
      status = 'assigned'
    } = req.body;

    if (!taskId || !assignedTo || !reason) {
      return res.status(400).json({
        success: false,
        message: 'taskId, assignedTo, and reason are required fields'
      });
    }

    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if assignedTo employee exists and is employee
    const assignedToEmployee = await Employee.findOne({
      _id: assignedTo,
      isActive: true
    });

    if (!assignedToEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Assigned employee not found or is not active'
      });
    }

    // Check permissions
    if (req.employee.role === 'employee' && task.assignedTo?.toString() !== req.employee.employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    // Create assignment log
    const assignmentLog = new TaskAssignmentLog({
      taskId,
      assignedTo,
      assignedBy: req.employee.employeeId,
      reason,
      status
    });

    await assignmentLog.save();

    // Populate for response
    await assignmentLog.populate('taskId', 'title priority status');
    await assignmentLog.populate('assignedTo', 'employeename profile department');
    await assignmentLog.populate('assignedBy', 'employeename profile');

    res.status(201).json({
      success: true,
      message: 'Assignment log created successfully',
      data: assignmentLog
    });

  } catch (error) {
    console.error('Create assignment log error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating assignment log'
    });
  }
});

// Delete assignment log (Admin only)
router.delete('/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const deletedLog = await TaskAssignmentLog.findByIdAndDelete(req.params.id);

    if (!deletedLog) {
      return res.status(404).json({
        success: false,
        message: 'Assignment log not found'
      });
    }

    res.json({
      success: true,
      message: 'Assignment log deleted successfully',
      data: deletedLog
    });

  } catch (error) {
    console.error('Delete assignment log error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment log ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting assignment log'
    });
  }
});

// Get assignment statistics
router.get('/stats/overview', verifyJWT, requireAdmin, async (req, res) => {
  try {
    // Total assignments
    const totalAssignments = await TaskAssignmentLog.countDocuments();

    // Assignments by status
    const assignmentsByStatus = await TaskAssignmentLog.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Assignments by employee
    const assignmentsByEmployee = await TaskAssignmentLog.aggregate([
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $project: {
          employee: {
            _id: '$employee._id',
            employeename: '$employee.employeename',
            profile: '$employee.profile',
            department: '$employee.department'
          },
          assignmentCount: '$count'
        }
      }
    ]);

    // Recent assignments (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentAssignments = await TaskAssignmentLog.countDocuments({
      assignedAt: { $gte: oneWeekAgo }
    });

    res.json({
      success: true,
      message: 'Assignment statistics fetched successfully',
      data: {
        totalAssignments,
        assignmentsByStatus,
        assignmentsByEmployee,
        recentAssignments
      }
    });

  } catch (error) {
    console.error('Get assignment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching assignment statistics'
    });
  }
});

export default router;