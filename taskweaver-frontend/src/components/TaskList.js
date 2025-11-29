import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateStatus } from "../redux/Slices/taskSlice.js"
import { taskService } from '../services/taskService';
import '../styles/TaskList.css';

const TaskList = ({ tasks }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { employee } = useSelector((state) => state.auth);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.updateStatus(taskId, newStatus);
      // You can dispatch an action to update the local state if needed
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'in-progress': return '#ff9800';
      case 'assigned': return '#2196f3';
      default: return '#9e9e9e';
    }
  };

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div key={task._id} className="task-card" onClick={() => navigate(`/tasks/${task._id}`)}>
          <div className="task-header">
            <h3>{task.title}</h3>
            <span className="priority-badge">{task.priority}</span>
          </div>
          <p className="task-description">{task.description}</p>
          <div className="task-meta">
            <span className="status" style={{ backgroundColor: getStatusColor(task.status) }}>
              {task.status}
            </span>
            {task.dueDate && (
              <span className="due-date">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
          {employee?.role === 'employee' && task.assignedTo?._id === employee.employeeId && (
            <div className="task-actions">
              <select 
                value={task.status} 
                onChange={(e) => handleStatusChange(task._id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="assigned">Assigned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TaskList;