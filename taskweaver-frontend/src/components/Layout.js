import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from "../redux/Slices/authSlice.js"
import '../styles/Layout.css';

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { employee } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <h2>TaskWeaver</h2>
        </div>
        <div className="nav-links">
          <button onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button onClick={() => navigate('/tasks')}>Tasks</button>
          {employee?.role === 'admin' && (
            <>
              <button onClick={() => navigate('/employees')}>Employees</button>
              <button onClick={() => navigate('/assignments')}>Assignments</button>
            </>
          )}
        </div>
        <div className="nav-user">
          <span>Welcome, {employee?.firstName}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;