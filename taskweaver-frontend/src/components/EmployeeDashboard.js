import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/EmployeeDashboard.css';

const EmployeeDashboard = ({ stats }) => {
  return (
    <div className="employee-dashboard">
      {/* Personal Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>My Tasks</h3>
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
          <h3>Pending</h3>
          <p className="stat-number">{stats?.pendingTasks || 0}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="actions-grid">
        <Link to="/tasks" className="action-card">
          <h3>My Tasks</h3>
          <p>View and manage assigned tasks</p>
        </Link>
        <Link to="/tasks?status=in-progress" className="action-card">
          <h3>Active Tasks</h3>
          <p>Tasks currently in progress</p>
        </Link>
        <Link to="/tasks?status=completed" className="action-card">
          <h3>Completed Tasks</h3>
          <p>View your completed work</p>
        </Link>
      </div>
    </div>
  );
};

export default EmployeeDashboard;