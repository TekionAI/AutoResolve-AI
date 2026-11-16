import api from './api';
export const repairOrderService = {
  getAll: () => api.get('/repair-orders'),
  getById: (id) => api.get(`/repair-orders/${id}`),
  create: (data) => api.post('/repair-orders', data),
  update: (id, data) => api.put(`/repair-orders/${id}`, data)
};