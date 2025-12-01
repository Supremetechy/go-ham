// Bookings API Service
import apiClient from './client';

export const bookingsAPI = {
  // Get all bookings
  getAll: async () => {
    const response = await apiClient.get('/api/bookings');
    return response.data;
  },

  // Get booking by ID
  getById: async (id) => {
    const response = await apiClient.get(`/api/bookings/${id}`);
    return response.data;
  },

  // Create new booking
  create: async (bookingData) => {
    const response = await apiClient.post('/api/bookings', bookingData);
    return response.data;
  },

  // Update booking
  update: async (id, bookingData) => {
    const response = await apiClient.put(`/api/bookings/${id}`, bookingData);
    return response.data;
  },

  // Delete booking
  delete: async (id) => {
    const response = await apiClient.delete(`/api/bookings/${id}`);
    return response.data;
  },

  // Update booking status
  updateStatus: async (id, status) => {
    const response = await apiClient.patch(`/api/bookings/${id}/status`, { status });
    return response.data;
  },
};

export default bookingsAPI;
