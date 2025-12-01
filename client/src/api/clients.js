// Clients API Service
import apiClient from './client';

export const clientsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/api/clients');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/api/clients/${id}`);
    return response.data;
  },

  create: async (clientData) => {
    const response = await apiClient.post('/api/clients', clientData);
    return response.data;
  },

  update: async (id, clientData) => {
    const response = await apiClient.put(`/api/clients/${id}`, clientData);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/api/clients/${id}`);
    return response.data;
  },

  segment: async (segmentType) => {
    const response = await apiClient.get(`/api/clients/segment/${segmentType}`);
    return response.data;
  },
};

export default clientsAPI;
