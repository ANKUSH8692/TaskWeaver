import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import TaskAssignmentLog from '../models/TaskAssignmentLog.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create new task (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
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
      assignedBy: req.user.userId,
      status: assignedTo ? 'assigned' : 'pending'
    });

    await newTask.save();

    // If task is assigned, create assignment log
    if (assignedTo) {
      const assignmentLog = new TaskAssignmentLog({
        taskId: newTask._id,
        assignedTo,
        assignedBy: req.user.userId,
        reason: 'Manual assignment during task creation',
        status: 'assigned'
      });
      await assignmentLog.save();
    }

    // Populate for response
    await newTask.populate('assignedTo', 'username profile department');
    await newTask.populate('assignedBy', 'username profile');

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
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      status,
      priority,
      assignedTo,
      search
    } = req.query;

    // Build filter object
    const filter = {};

    // If user is employee, only show their tasks
    if (req.user.role === 'user') {
      filter.assignedTo = req.user.userId;
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
      .populate('assignedTo', 'username profile department')
      .populate('assignedBy', 'username profile')
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
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'username email profile department skills')
      .populate('assignedBy', 'username profile')
      .populate('comments');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to this task
    if (req.user.role === 'user' && task.assignedTo?._id.toString() !== req.user.userId) {
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
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    if (req.user.role === 'user' && task.assignedTo?.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update tasks assigned to you.'
      });
    }

    const updateData = { ...req.body };
    
    // Employees can only update status and feedback
    if (req.user.role === 'user') {
      const allowedFields = ['status', 'feedback'];
      Object.keys(updateData).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });
    }

    // If admin is reassigning task
    if (req.user.role === 'admin' && updateData.assignedTo) {
      // Create assignment log for reassignment
      const assignmentLog = new TaskAssignmentLog({
        taskId: task._id,
        assignedTo: updateData.assignedTo,
        assignedBy: req.user.userId,
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
      .populate('assignedTo', 'username profile department')
      .populate('assignedBy', 'username profile');

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
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
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
router.post('/:id/assign', authenticateToken, requireAdmin, async (req, res) => {
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
        assignedBy: req.user.userId,
        reason: 'Manual assignment by admin',
        status: 'assigned'
      });
      await assignmentLog.save();

      await task.populate('assignedTo', 'username profile department');

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
        assignedBy: req.user.userId,
        reason: `Auto-assigned using SJF algorithm. Workload score: ${bestEmployee.priorityScore.toFixed(2)}`,
        status: 'assigned'
      });
      await assignmentLog.save();

      await task.populate('assignedTo', 'username profile department');

      return res.json({
        success: true,
        message: `Task auto-assigned to ${bestEmployee.employee.username}`,
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
router.patch('/:id/status', authenticateToken, async (req, res) => {
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
    if (req.user.role === 'user' && task.assignedTo?.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update status of tasks assigned to you.'
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('assignedTo', 'username profile department')
      .populate('assignedBy', 'username profile');

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

// Add documents to task
router.post('/:id/documents', authenticateToken, async (req, res) => {
  try {
    const { documents } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    if (req.user.role === 'user' && task.assignedTo?.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only add documents to tasks assigned to you.'
      });
    }

    // Add new documents to the existing array
    task.document.push(...documents);
    await task.save();

    await task.populate('assignedTo', 'username profile department');

    res.json({
      success: true,
      message: 'Documents added successfully',
      data: task
    });

  } catch (error) {
    console.error('Add documents error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while adding documents'
    });
  }
});

// Submit feedback for task
router.post('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { rating, comments } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions - only assigned employee can submit feedback
    if (req.user.role === 'user' && task.assignedTo?.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only submit feedback for tasks assigned to you.'
      });
    }

    // Update feedback
    task.feedback = {
      rating,
      comments,
      submittedAt: new Date()
    };

    await task.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: task
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while submitting feedback'
    });
  }
});

// Get tasks statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    let filter = {};

    // If user is employee, only show their stats
    if (req.user.role === 'user') {
      filter.assignedTo = req.user.userId;
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

// SJF Algorithm Helper Function
async function findBestEmployeeForTask(task) {
  try {
    // Get all active employees
    const employees = await User.find({ 
      isActive: true, 
      role: 'user' 
    }).select('username profile department skills');

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

export default router;