import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { assignmentService } from '../services/assignmentService.js';
import '../styles/AssignmentsPage.css';

const AssignmentsPage = () => {
  const dispatch = useDispatch();
  const { employee } = useSelector((state) => state.auth);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    taskId: '',
    employeeId: '',
    algorithm: '',
    startDate: '',
    endDate: ''
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchAssignments();
    fetchStats();
  }, [filters]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await assignmentService.getAssignments(params.toString());
      setAssignments(response.data || response.data);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await assignmentService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      taskId: '',
      employeeId: '',
      algorithm: '',
      startDate: '',
      endDate: ''
    });
  };

  const getAlgorithmColor = (algorithm) => {
    switch (algorithm) {
      case 'shortest-job': return '#4caf50';
      case 'skill-based': return '#2196f3';
      case 'manual': return '#ff9800';
      case 'round-robin': return '#9c27b0';
      case 'priority-based': return '#f44336';
      default: return '#666';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (employee?.role !== 'admin') {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You need admin privileges to view assignment logs.</p>
      </div>
    );
  }

  return (
    <div className="assignments-page">
      <div className="page-header">
        <h1>Assignment Logs</h1>
        <p>Track and monitor all task assignments in the system</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="stats-overview">
          <div className="stat-item">
            <h3>Total Assignments</h3>
            <span className="stat-number">{stats.totalAssignments}</span>
          </div>
          <div className="stat-item">
            <h3>By Algorithm</h3>
            <div className="algorithm-stats">
              {stats.assignmentsByAlgorithm?.map(item => (
                <div key={item._id} className="algorithm-item">
                  <span className="algorithm-name">{item._id}</span>
                  <span className="algorithm-count">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Task ID</label>
            <input
              type="text"
              value={filters.taskId}
              onChange={(e) => handleFilterChange('taskId', e.target.value)}
              placeholder="Enter task ID"
            />
          </div>
          <div className="filter-group">
            <label>Employee ID</label>
            <input
              type="text"
              value={filters.employeeId}
              onChange={(e) => handleFilterChange('employeeId', e.target.value)}
              placeholder="Enter employee ID"
            />
          </div>
          <div className="filter-group">
            <label>Algorithm</label>
            <select
              value={filters.algorithm}
              onChange={(e) => handleFilterChange('algorithm', e.target.value)}
            >
              <option value="">All Algorithms</option>
              <option value="shortest-job">Shortest Job First</option>
              <option value="skill-based">Skill Based</option>
              <option value="manual">Manual</option>
              <option value="round-robin">Round Robin</option>
              <option value="priority-based">Priority Based</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>
        <div className="filter-actions">
          <button onClick={clearFilters} className="btn-secondary">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Assignments List */}
      <div className="assignments-list">
        <div className="list-header">
          <h3>Assignment History</h3>
          <span className="result-count">{assignments.length} assignments found</span>
        </div>

        {loading ? (
          <div className="loading">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="empty-state">
            <h3>No assignments found</h3>
            <p>Try adjusting your filters or check back later for new assignments.</p>
          </div>
        ) : (
          <div className="assignments-table">
            <div className="table-header">
              <div className="col-task">Task</div>
              <div className="col-employee">Assigned To</div>
              <div className="col-admin">Assigned By</div>
              <div className="col-algorithm">Algorithm</div>
              <div className="col-date">Assigned At</div>
              <div className="col-reason">Reason</div>
            </div>
            <div className="table-body">
              {assignments.map((assignment) => (
                <div key={assignment._id} className="table-row">
                  <div className="col-task">
                    <div className="task-info">
                      <strong>{assignment.taskId?.title || 'N/A'}</strong>
                      <span>Priority: {assignment.taskId?.priority || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="col-employee">
                    <div className="employee-info">
                      <img
                        src={assignment.assignedTo?.profile?.avatar || '/default-avatar.png'}
                        alt="Employee"
                        className="employee-avatar"
                      />
                      <div>
                        <strong>
                          {assignment.assignedTo?.profile?.firstName} {assignment.assignedTo?.profile?.lastName}
                        </strong>
                        <span>{assignment.assignedTo?.department}</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-admin">
                    <div className="admin-info">
                      <strong>
                        {assignment.assignedBy?.profile?.firstName} {assignment.assignedBy?.profile?.lastName}
                      </strong>
                      <span>Admin</span>
                    </div>
                  </div>
                  <div className="col-algorithm">
                    <span
                      className="algorithm-tag"
                      style={{ backgroundColor: getAlgorithmColor(assignment.algorithmUsed) }}
                    >
                      {assignment.algorithmUsed}
                    </span>
                  </div>
                  <div className="col-date">
                    {formatDate(assignment.assignedAt)}
                  </div>
                  <div className="col-reason">
                    {assignment.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentsPage;