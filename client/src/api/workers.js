// Workers API Service
import apiClient from './client';

export const workersAPI = {
  getAll: async () => {
    const response = await apiClient.get('/api/workers');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/api/workers/${id}`);
    return response.data;
  },

  create: async (workerData) => {
    const response = await apiClient.post('/api/workers', workerData);
    return response.data;
  },

  update: async (id, workerData) => {
    const response = await apiClient.put(`/api/workers/${id}`, workerData);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/api/workers/${id}`);
    return response.data;
  },

  toggleStatus: async (id) => {
    const response = await apiClient.patch(`/api/workers/${id}/toggle-status`);
    return response.data;
  },
};

export default workersAPI;
