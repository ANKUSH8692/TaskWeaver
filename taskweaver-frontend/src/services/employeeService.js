import api from './api';

export const employeeService = {
  getEmployees: async (queryParams = '') => {
    const response = await api.get(`/employees?${queryParams}`);
    return response.data;
  },

  getEmployee: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  updateEmployee: async (id, employeeData) => {
    const response = await api.post(`/employees/update-profile/${id}`, employeeData);
    return response.data;
  },

  deactivateEmployee: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/employees/stats/overview');
    return response.data;
  },

  getEmployeesByDepartment: async (department) => {
    const response = await api.get(`/employees/department/${department}`);
    return response.data;
  },
};
