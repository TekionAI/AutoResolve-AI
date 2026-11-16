
import api from './api';

export const technicianService = {
  getMyDashboard: () =>
    api.get('/technicians/me/dashboard'),

  startJob: (repairOrderId) =>
    api.patch(`/technicians/me/jobs/${repairOrderId}/start`),

  completeJob: (repairOrderId) =>
    api.patch(`/technicians/me/jobs/${repairOrderId}/complete`)
};
