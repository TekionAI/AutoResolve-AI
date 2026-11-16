import api from './api';
export const inventoryService = {
  getInventory: () => api.get('/inventory'),
  getParts: () => api.get('/parts'),
  getDealerships: () => api.get('/dealerships'),
  getVendors: () => api.get('/vendors')
};