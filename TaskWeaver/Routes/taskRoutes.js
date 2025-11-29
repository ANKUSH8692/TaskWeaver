import express from 'express';
import Task from '../models/Task.model.js';
import Employee from '../models/employee.model.js';
import TaskAssignmentLog from '../models/AssignmentLog.model.js';
import { verifyJWT, requireAdmin } from '../middleware/Auth.middleware.js';

const router = express.Router();

// SJF Algorithm Helper Function
async function findBestEmployeeForTask(task) {
  try {
    // Get all active employees
    const employees = await Employee.find({ 
      isActive: true, 
      role: 'employee' 
    }).select('employeename profile department skills');

    if (employees.length === 0) {
      return null;
    }

    const employeeWorkloads = await Promise.all(
      employees.map(async (employee) => {
        // Calculate current workload (tasks in progress or assigned)
        const currentTasks = await Task.find({
          assignedTo: employee._id,
          status: { $in: ['assigned', 'in-progress'] }
        });

        const currentWorkload = currentTasks.length;

        // Calculate priority score (lower workload = higher priority for SJF)
        const priorityScore = 1 / (1 + currentWorkload);

        return {
          employee,
          currentWorkload,
          priorityScore
        };
      })
    );

    // Sort by priority score (descending) - SJF: shortest job first
    employeeWorkloads.sort((a, b) => b.priorityScore - a.priorityScore);

    return employeeWorkloads[0]; // Return the best match

  } catch (error) {
    console.error('SJF algorithm error:', error);
    return null;
  }
}
// Create new task (Admin only)
router.post('/', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      document,
      priority,
      dueDate,
      assignedTo
    } = req.body;

    // Basic validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    // Create new task
    const newTask = new Task({
      title,
      description,
      document: document || [],
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignedTo: assignedTo || undefined,
      assignedBy: req.employee._id,
      status: assignedTo ? 'assigned' : 'pending'
    });

    await newTask.save();

    // If task is assigned, create assignment log
    if (assignedTo) {
      const assignmentLog = new TaskAssignmentLog({
        taskId: newTask._id,
        assignedTo,
        assignedBy: req.employee._id,
        reason: 'Manual assignment during task creation',
        status: 'assigned'
      });
      await assignmentLog.save();
    }

    // Populate for response
    await newTask.populate('assignedTo', 'employeename profile department');
    await newTask.populate('assignedBy', 'employeename profile');

    res.status(201).json({
      success: true,
      message: assignedTo ? 'Task created and assigned successfully' : 'Task created successfully',
      data: newTask
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating task'
    });
  }
});
// Get all tasks with filtering
router.get('/', verifyJWT, async (req, res) => {
  try {
    const {
      status,
      priority,
      assignedTo,
      search
    } = req.query;

    const filter = {};

    // If employee is employee, only show their tasks
    if (req.employee.role === 'employee') {
      filter.assignedTo = req.employee._id;
    } else if (assignedTo) {
      // Admin can filter by assignedTo
      filter.assignedTo = assignedTo;
    }

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'employeename profile department')
      .populate('assignedBy', 'employeename profile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Tasks fetched successfully',
      data: tasks,
      count: tasks.length
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching tasks'
    });
  }
});

// Get task by ID
router.get('/:id', verifyJWT, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'employeename email profile department skills')
      .populate('assignedBy', 'employeename profile')
      .populate('comments');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if employee has access to this task
    if (req.employee.role === 'employee' && task.assignedTo?._id.toString() !== req.employee._id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view tasks assigned to you.'
      });
    }

    res.json({
      success: true,
      message: 'Task fetched successfully',
      data: task
    });

  } catch (error) {
    console.error('Get task error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching task'
    });
  }
});
// Update task
router.put('/:id', verifyJWT, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    if (req.employee.role === 'employee' && task.assignedTo?.toString() !== req.employee._id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const updateData = { ...req.body };
    
    // Employees can only update status and feedback
    if (req.employee.role === 'employee') {
      const allowedFields = ['status', 'feedback'];
      Object.keys(updateData).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });
    }

    // If admin is reassigning task
    if (req.employee.role === 'admin' && updateData.assignedTo) {
      // Create assignment log for reassignment
      const assignmentLog = new TaskAssignmentLog({
        taskId: task._id,
        assignedTo: updateData.assignedTo,
        assignedBy: req.employee._id,
        reason: 'Task reassigned by admin',
        status: 'reassigned'
      });
      await assignmentLog.save();

      updateData.status = 'assigned';
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    )
      .populate('assignedTo', 'employeename profile department')
      .populate('assignedBy', 'employeename profile');

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });

  } catch (error) {
    console.error('Update task error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating task'
    });
  }
});
// Delete task (Admin only)
router.delete('/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
      data: deletedTask
    });

  } catch (error) {
    console.error('Delete task error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting task'
    });
  }
});
// Assign task to employee (Admin only - using SJF algorithm)
router.post('/:id/assign', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const { assignedTo, autoAssign = false } = req.body;

    // Manual assignment
    if (assignedTo) {
      task.assignedTo = assignedTo;
      task.status = 'assigned';
      await task.save();

      // Create assignment log
      const assignmentLog = new TaskAssignmentLog({
        taskId: task._id,
        assignedTo,
        assignedBy: req.employee._id,
        reason: 'Manual assignment by admin',
        status: 'assigned'
      });
      await assignmentLog.save();

      await task.populate('assignedTo', 'employeename profile department');

      return res.json({
        success: true,
        message: 'Task assigned successfully',
        data: task
      });
    }

    // Auto assignment using SJF algorithm
    if (autoAssign) {
      const bestEmployee = await findBestEmployeeForTask(task);
      
      if (!bestEmployee) {
        return res.status(400).json({
          success: false,
          message: 'No suitable employee found for this task'
        });
      }

      task.assignedTo = bestEmployee.employee._id;
      task.status = 'assigned';
      await task.save();

      // Create assignment log
      const assignmentLog = new TaskAssignmentLog({
        taskId: task._id,
        assignedTo: bestEmployee.employee._id,
        assignedBy: req.employee._id,
        reason: `Auto-assigned using SJF algorithm. Workload score: ${bestEmployee.priorityScore.toFixed(2)}`,
        status: 'assigned'
      });
      await assignmentLog.save();

      await task.populate('assignedTo', 'employeename profile department');

      return res.json({
        success: true,
        message: `Task auto-assigned to ${bestEmployee.employee.employeename}`,
        data: task,
        assignmentDetails: {
          employee: bestEmployee.employee,
          priorityScore: bestEmployee.priorityScore.toFixed(2)
        }
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Either assignedTo or autoAssign must be provided'
    });

  } catch (error) {
    console.error('Assign task error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while assigning task'
    });
  }
});

// Update task status
router.patch('/:id/status', verifyJWT, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    if (req.employee.role === 'employee' && task.assignedTo?.toString() !== req.employee._id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('assignedTo', 'employeename profile department')
      .populate('assignedBy', 'employeename profile');

    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: updatedTask
    });

  } catch (error) {
    console.error('Update task status error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating task status'
    });
  }
});

// Add progress update to task (Employee only)
router.post('/:id/progress', verifyJWT, async (req, res) => {
  try {
    const { progress } = req.body;

    if (!progress) {
      return res.status(400).json({
        success: false,
        message: 'Progress update is required'
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if employee is assigned to this task
    if (req.employee.role === 'employee' && task.assignedTo?.toString() !== req.employee._id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update progress on tasks assigned to you.'
      });
    }

    // Add progress update
    task.progress.push({
      progress,
      submittedBy: req.employee._id,
      submittedAt: new Date()
    });

    await task.save();

    // Populate for response
    await task.populate('progress.submittedBy', 'employeename firstName lastName');
    await task.populate('assignedTo', 'employeename firstName lastName department');

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: task
    });

  } catch (error) {
    console.error('Add progress error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating progress'
    });
  }
});

// Rate completed task (Admin only)
router.post('/:id/rating', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { rating, comments } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required and must be between 1 and 5'
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if task is completed
    if (task.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only rate completed tasks'
      });
    }

    // Update admin rating
    task.adminRating = {
      rating,
      comments: comments || '',
      ratedBy: req.employee._id,
      ratedAt: new Date()
    };

    await task.save();

    // Populate for response
    await task.populate('adminRating.ratedBy', 'employeename firstName lastName');
    await task.populate('assignedTo', 'employeename firstName lastName department');
    await task.populate('progress.submittedBy', 'employeename firstName lastName');

    res.json({
      success: true,
      message: 'Task rated successfully',
      data: task
    });

  } catch (error) {
    console.error('Rate task error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while rating task'
    });
  }
});
// Get tasks statistics
router.get('/stats/overview', verifyJWT, async (req, res) => {
  try {
    let filter = {};

    // If employee is employee, only show their stats
    if (req.employee.role === 'employee') {
      filter.assignedTo = req.employee._id;
    }

    const totalTasks = await Task.countDocuments(filter);
    const completedTasks = await Task.countDocuments({ ...filter, status: 'completed' });
    const inProgressTasks = await Task.countDocuments({ ...filter, status: 'in-progress' });
    const pendingTasks = await Task.countDocuments({ ...filter, status: 'pending' });
    const assignedTasks = await Task.countDocuments({ ...filter, status: 'assigned' });

    // Overdue tasks
    const overdueTasks = await Task.countDocuments({
      ...filter,
      dueDate: { $lt: new Date() },
      status: { $in: ['pending', 'assigned', 'in-progress'] }
    });

    res.json({
      success: true,
      message: 'Task statistics fetched successfully',
      data: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        assignedTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching task statistics'
    });
  }
});

export default router;