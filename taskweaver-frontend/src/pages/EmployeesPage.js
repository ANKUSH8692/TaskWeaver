import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { employeeService } from '../services/employeeService.js';
import '../styles/EmployeesPage.css';

const EmployeesPage = () => {
  const dispatch = useDispatch();
  const { employee: currentEmployee } = useSelector((state) => state.auth);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    role: ''
  });
  const [stats, setStats] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchStats();
  }, [filters]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await employeeService.getEmployees(params.toString());
      setEmployees(response.data || response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await employeeService.getStats();
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
      search: '',
      department: '',
      role: ''
    });
  };

  const handleViewDetails = (emp) => {
    setSelectedEmployee(emp);
    setShowDetails(true);
  };

  const handleDeactivate = async (employeeId) => {
    if (window.confirm('Are you sure you want to deactivate this employee?')) {
      try {
        await employeeService.deactivateEmployee(employeeId);
        fetchEmployees(); // Refresh the list
        alert('Employee deactivated successfully');
      } catch (error) {
        console.error('Failed to deactivate employee:', error);
        alert('Failed to deactivate employee');
      }
    }
  };

  const getDepartmentColor = (department) => {
    const colors = {
      'Engineering': '#4caf50',
      'Design': '#2196f3',
      'Marketing': '#ff9800',
      'Sales': '#9c27b0',
      'HR': '#f44336',
      'Finance': '#607d8b',
      'Operations': '#795548'
    };
    return colors[department] || '#666';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (currentEmployee?.role !== 'admin') {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You need admin privileges to view employee management.</p>
      </div>
    );
  }

  return (
    <div className="employees-page">
      <div className="page-header">
        <h1>Employee Management</h1>
        <p>Manage your team members and their roles</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="stats-overview">
          <div className="stat-card">
            <h3>Total Employees</h3>
            <span className="stat-number">{stats.totalEmployees}</span>
          </div>
          <div className="stat-card">
            <h3>Admins</h3>
            <span className="stat-number">{stats.adminEmployees}</span>
          </div>
          <div className="stat-card">
            <h3>Team Members</h3>
            <span className="stat-number">{stats.employeeEmployees}</span>
          </div>
          <div className="stat-card">
            <h3>Departments</h3>
            <span className="stat-number">{stats.usersByDepartment?.length || 0}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by name, email, or username"
            />
          </div>
          <div className="filter-group">
            <label>Department</label>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Role</label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button onClick={clearFilters} className="btn-secondary">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Employees List */}
      <div className="employees-list">
        <div className="list-header">
          <h3>Team Members</h3>
          <span className="result-count">{employees.length} employees found</span>
        </div>

        {loading ? (
          <div className="loading">Loading employees...</div>
        ) : employees.length === 0 ? (
          <div className="empty-state">
            <h3>No employees found</h3>
            <p>Try adjusting your filters or add new team members.</p>
          </div>
        ) : (
          <div className="employees-grid">
            {employees.map((emp) => (
              <div key={emp._id} className="employee-card">
                <div className="card-header">
                  <img
                    src={emp.profile_picture || '/default-avatar.png'}
                    alt={emp.employeename}
                    className="employee-avatar"
                  />
                  <div className="employee-basic-info">
                    <h3>{emp.firstName} {emp.lastName}</h3>
                    <p>@{emp.employeename}</p>
                  </div>
                  <span className={`role-badge ${emp.role}`}>
                    {emp.role}
                  </span>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="label">Email:</span>
                    <span className="value">{emp.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Department:</span>
                    <span
                      className="value department-tag"
                      style={{ borderLeftColor: getDepartmentColor(emp.department) }}
                    >
                      {emp.department || 'Not assigned'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Position:</span>
                    <span className="value">{emp.position || 'Not specified'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Joined:</span>
                    <span className="value">{formatDate(emp.DateOfJoining)}</span>
                  </div>
                  {emp.skills && emp.skills.length > 0 && (
                    <div className="skills-section">
                      <span className="label">Skills:</span>
                      <div className="skills-list">
                        {emp.skills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="skill-tag">
                            {skill}
                          </span>
                        ))}
                        {emp.skills.length > 3 && (
                          <span className="skill-more">+{emp.skills.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  <button
                    onClick={() => handleViewDetails(emp)}
                    className="btn-primary"
                  >
                    View Details
                  </button>
                  {emp._id !== currentEmployee.employeeId && (
                    <button
                      onClick={() => handleDeactivate(emp._id)}
                      className="btn-danger"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Employee Details Modal */}
      {showDetails && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Employee Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-avatar">
                  <img
                    src={selectedEmployee.profile_picture || '/default-avatar.png'}
                    alt={selectedEmployee.employeename}
                  />
                </div>
                <div className="detail-info">
                  <h3>{selectedEmployee.firstName} {selectedEmployee.lastName}</h3>
                  <p>@{selectedEmployee.employeename}</p>
                  <div className="detail-meta">
                    <span className={`role-badge large ${selectedEmployee.role}`}>
                      {selectedEmployee.role}
                    </span>
                    <span
                      className="department-tag large"
                      style={{ borderLeftColor: getDepartmentColor(selectedEmployee.department) }}
                    >
                      {selectedEmployee.department}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <label>Email</label>
                  <span>{selectedEmployee.email}</span>
                </div>
                <div className="detail-item">
                  <label>Position</label>
                  <span>{selectedEmployee.position || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <label>Date Joined</label>
                  <span>{formatDate(selectedEmployee.DateOfJoining)}</span>
                </div>
                <div className="detail-item">
                  <label>Last Login</label>
                  <span>
                    {selectedEmployee.lastLogin
                      ? formatDate(selectedEmployee.lastLogin)
                      : 'Never'
                    }
                  </span>
                </div>
              </div>

              {selectedEmployee.skills && selectedEmployee.skills.length > 0 && (
                <div className="detail-section">
                  <h4>Skills</h4>
                  <div className="skills-list-detailed">
                    {selectedEmployee.skills.map((skill, index) => (
                      <span key={index} className="skill-tag detailed">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEmployee.profile && (
                <div className="detail-section">
                  <h4>Contact Information</h4>
                  <div className="contact-info">
                    {selectedEmployee.profile.phone && (
                      <div className="contact-item">
                        <label>Phone:</label>
                        <span>{selectedEmployee.profile.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setShowDetails(false)}
                className="btn-secondary"
              >
                Close
              </button>
              {selectedEmployee._id !== currentEmployee.employeeId && (
                <button
                  onClick={() => {
                    handleDeactivate(selectedEmployee._id);
                    setShowDetails(false);
                  }}
                  className="btn-danger"
                >
                  Deactivate Employee
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;