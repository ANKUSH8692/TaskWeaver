import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/AdminDashboard.css';

const AdminDashboard = ({ stats }) => {
  return (
    <div className="admin-dashboard">
      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Tasks</h3>
          <p className="stat-number">{stats?.totalTasks || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p className="stat-number">{stats?.completedTasks || 0}</p>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <p className="stat-number">{stats?.inProgressTasks || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Overdue</h3>
          <p className="stat-number">{stats?.overdueTasks || 0}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="actions-grid">
        <Link to="/tasks" className="action-card">
          <h3>Manage Tasks</h3>
          <p>Create, assign, and monitor tasks</p>
        </Link>
        <Link to="/employees" className="action-card">
          <h3>Employee Management</h3>
          <p>View and manage team members</p>
        </Link>
        <Link to="/assignments" className="action-card">
          <h3>Assignment Logs</h3>
          <p>Track task assignments and history</p>
        </Link>
        <Link to="/tasks/new" className="action-card">
          <h3>Create New Task</h3>
          <p>Add a new task to the system</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;