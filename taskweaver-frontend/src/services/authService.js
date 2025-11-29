import api from './api.js';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (employeeData) => {
    const formData = new FormData();
    Object.keys(employeeData).forEach(key => {
      if (key === 'skills' && Array.isArray(employeeData[key])) {
        formData.append(key, employeeData[key].join(','));
      } else if (key === 'profile_picture' && employeeData[key]) {
        formData.append(key, employeeData[key]);
      } else {
        formData.append(key, employeeData[key]);
      }
    });

    const response = await api.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
};