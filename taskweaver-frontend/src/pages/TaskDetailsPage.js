import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { taskService } from '../services/taskService';
import { employeeService } from '../services/employeeService';
import { getTaskSuccess } from "../redux/Slices/taskSlice.js"
import '../styles/TaskDetailsPage.css';

const TaskDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentTask } = useSelector((state) => state.tasks);
  const { employee } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignedTo: ''
  });
  const [employees, setEmployees] = useState([]);
  const [progressUpdate, setProgressUpdate] = useState('');
  const [rating, setRating] = useState({ score: 5, comments: '' });

  const isNew = id === 'new';
  const isAdmin = employee?.role === 'admin';

  useEffect(() => {
    if (!isNew) {
      fetchTask();
    }
    if (isAdmin) {
      fetchEmployees();
    }
  }, [id]);

  useEffect(() => {
    if (currentTask && !isNew) {
      setFormData({
        title: currentTask.title || '',
        description: currentTask.description || '',
        priority: currentTask.priority || 'medium',
        dueDate: currentTask.dueDate ? new Date(currentTask.dueDate).toISOString().split('T')[0] : '',
        assignedTo: currentTask.assignedTo?._id || ''
      });
    }
  }, [currentTask]);

  const fetchTask = async () => {
    try {
      const response = await taskService.getTask(id);
      dispatch(getTaskSuccess(response.data));
    } catch (error) {
      console.error('Failed to fetch task:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getEmployees();
      console.log('Fetch Employees Response:', response);

      let employeesData = [];

      if (Array.isArray(response.data)) {
        employeesData = response.data;
      } else if (response.data?.employees && Array.isArray(response.data.employees)) {
        employeesData = response.data.employees;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        employeesData = response.data.data;
      } else if (Array.isArray(response)) {
        employeesData = response;
      }

      console.log('Extracted Employees Data:', employeesData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setEmployees([]);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isNew) {
        await taskService.createTask(formData);
      } else {
        await taskService.updateTask(id, formData);
      }
      navigate('/tasks');
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleAddProgress = async () => {
    if (!progressUpdate.trim()) return;

    try {
      await taskService.addProgress(id, progressUpdate);
      setProgressUpdate('');
      fetchTask();
    } catch (error) {
      console.error('Failed to add progress:', error);
    }
  };

  const handleAddRating = async () => {
    try {
      await taskService.addRating(id, rating);
      setRating({ score: 5, comments: '' });
      fetchTask();
    } catch (error) {
      console.error('Failed to add rating:', error);
    }
  };

  return (
    <div className="task-details-page">
      <div className="task-form-container">
        <h2>{isNew ? 'Create New Task' : 'Task Details'}</h2>

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={!isAdmin}
              required
            />
          </div>

          <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={!isAdmin}
            required
            rows="4"
          />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Priority</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            disabled={!isAdmin}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="form-group">
          <label>Due Date</label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            disabled={!isAdmin}
            required
          />
        </div>
      </div>

      {isAdmin && (
        <div className="form-group">
          <label>Assign To</label>
          <select
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
            required
          >
            <option value="">Select Employee</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.employeename} ({emp.department})
              </option>
            ))}
          </select>
        </div>
      )}

      {isAdmin && (
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {isNew ? 'Create Task' : 'Update Task'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/tasks')}
          >
            Cancel
          </button>
        </div>
      )}
    </form>
      </div >

  {!isNew && (
    <div className="task-interactions">
      <div className="progress-section">
        <h3>Progress Updates</h3>
        {employee?.role === 'employee' && currentTask?.assignedTo?._id === employee.employeeId && (
          <div className="add-progress">
            <textarea
              value={progressUpdate}
              onChange={(e) => setProgressUpdate(e.target.value)}
              placeholder="Add progress update..."
            />
            <button onClick={handleAddProgress} className="btn-secondary">Add Update</button>
          </div>
        )}
        <div className="progress-list">
          {currentTask?.progress?.length > 0 ? (
            currentTask.progress.map((update, index) => (
              <div key={index} className="progress-item">
                <p>{update}</p>
                <span className="timestamp">{new Date().toLocaleDateString()}</span>
              </div>
            ))
          ) : (
            <p className="no-data">No progress updates yet.</p>
          )}
        </div>
      </div>

      {isAdmin && currentTask?.status === 'completed' && (
        <div className="rating-section">
          <h3>Rate Task</h3>
          <div className="rating-form">
            <select
              value={rating.score}
              onChange={(e) => setRating(prev => ({ ...prev, score: parseInt(e.target.value) }))}
            >
              {[1, 2, 3, 4, 5].map(score => (
                <option key={score} value={score}>{score} Star{score !== 1 ? 's' : ''}</option>
              ))}
            </select>
            <textarea
              value={rating.comments}
              onChange={(e) => setRating(prev => ({ ...prev, comments: e.target.value }))}
              placeholder="Add comments..."
            />
            <button onClick={handleAddRating} className="btn-primary">Submit Rating</button>
          </div>
        </div>
      )}
    </div>
  )}
    </div >
  );
};

export default TaskDetailsPage; 
