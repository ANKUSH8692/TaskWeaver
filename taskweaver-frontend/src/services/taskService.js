import api from './api';

export const taskService = {
  getTasks: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });

    const response = await api.get(`/tasks?${params.toString()}`);
    return response.data;
  },

  getTask: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  updateTask: async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  assignTask: async (id, assignmentData) => {
    const response = await api.post(`/tasks/${id}/assign`, assignmentData);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/tasks/${id}/status`, { status });
    return response.data;
  },

  addProgress: async (id, progress) => {
    const response = await api.post(`/tasks/${id}/progress`, { progress });
    return response.data;
  },

  addRating: async (id, ratingData) => {
    const response = await api.post(`/tasks/${id}/rating`, ratingData);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/tasks/stats/overview');
    return response.data;
  },
};