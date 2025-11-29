import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';
import EmployeeDashboard from '../components/EmployeeDashboard';
import { taskService } from '../services/taskService';
import { getStatsSuccess } from "../redux/Slices/taskSlice.js"
import '../styles/Dashboard.css';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { employee } = useSelector((state) => state.auth);
  const { stats } = useSelector((state) => state.tasks);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await taskService.getStats();
        dispatch(getStatsSuccess(response.data));
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, [dispatch]);

  if (!employee) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {employee.firstName}!</h1>
          <p>Here's what's happening with your tasks today.</p>
        </div>
        <div className="user-info">
          <img src={employee.profile_picture} alt="Profile" className="profile-pic" />
          <span>{employee.employeename}</span>
        </div>
      </header>

      {employee.role === 'admin' ? (
        <AdminDashboard stats={stats} />
      ) : (
        <EmployeeDashboard stats={stats} />
      )}
    </div>
  );
};

export default Dashboard;