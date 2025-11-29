import api from './api';

export const assignmentService = {
  getAssignments: async (queryParams = '') => {
    const response = await api.get(`/assignments?${queryParams}`);
    return response.data;
  },

  getAssignment: async (id) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  getAssignmentsByTask: async (taskId) => {
    const response = await api.get(`/assignments/task/${taskId}`);
    return response.data;
  },

  getAssignmentsByEmployee: async (employeeId) => {
    const response = await api.get(`/assignments/employee/${employeeId}`);
    return response.data;
  },

  createAssignment: async (assignmentData) => {
    const response = await api.post('/assignments', assignmentData);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/assignments/stats/overview');
    return response.data;
  },

  deleteAssignment: async (id) => {
    const response = await api.delete(`/assignments/${id}`);
    return response.data;
  }
};