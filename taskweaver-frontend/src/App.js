import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/TaskPage';
import TaskDetailsPage from './pages/TaskDetailsPage';
import EmployeesPage from './pages/EmployeesPage';
import AssignmentsPage from './pages/AssignmentsPage';
import Layout from './components/Layout';
import './App.css'

function App() {
  const { isAuthenticated, employee } = useSelector((state) => state.auth);

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />} />

        {/* Protected Routes */}
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/:id" element={<TaskDetailsPage />} />
          {employee?.role === 'admin' && (
            <>
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="assignments" element={<AssignmentsPage />} />
            </>
          )}
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;