import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure } from "../redux/Slices/authSlice.js"
import { authService } from '../services/authService';
import '../styles/AuthPage.css';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        employeename: '',
        email: '',
        password: '',
        department: '',
        position: '',
        skills: '',
        profile_picture: null,
    });
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    const handleChange = (e) => {
        if (e.target.name === 'profile_picture') {
            setFormData({
                ...formData,
                profile_picture: e.target.files[0],
            });
        } else {
            setFormData({
                ...formData,
                [e.target.name]: e.target.value,
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(loginStart());

        try {
            const response = await authService.register(formData);
            dispatch(loginSuccess(response));
            navigate('/dashboard');
        } catch (error) {
            dispatch(loginFailure(error.response?.data?.message || 'Registration failed'));
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h2>Join TaskWeaver</h2>
                    <p>Create your account to get started</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="employeename"
                            value={formData.employeename}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Department</label>
                            <input
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Position</label>
                            <input
                                type="text"
                                name="position"
                                value={formData.position}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Skills (comma separated)</label>
                        <input
                            type="text"
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            placeholder="JavaScript, React, Node.js"
                        />
                    </div>

                    <div className="form-group">
                        <label>Profile Picture (Optional)</label>
                        <input
                            type="file"
                            name="profile_picture"
                            onChange={handleChange}
                            accept="image/*"
                        />
                    </div>

                    <button type="submit" disabled={loading} className="auth-btn">
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Login here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
