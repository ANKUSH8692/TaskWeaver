import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getTasksSuccess, startLoading } from "../redux/Slices/taskSlice.js"
import { taskService } from '../services/taskService';
import TaskList from '../components/TaskList';
import '../styles/TasksPage.css';

const TasksPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tasks, loading } = useSelector((state) => state.tasks);
  const { employee } = useSelector((state) => state.auth);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const fetchTasks = async () => {
    dispatch(startLoading());
    try {
      const response = await taskService.getTasks(filters);
      dispatch(getTasksSuccess(response.data || []));
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="tasks-page">
      <div className="page-header">
        <h1>Tasks</h1>
        {employee?.role === 'admin' && (
          <button
            className="btn-primary"
            onClick={() => navigate('/tasks/new')}
          >
            Create New Task
          </button>
        )}
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={filters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading tasks...</div>
      ) : (
        <TaskList tasks={tasks} />
      )}
    </div>
  );
};

export default TasksPage;