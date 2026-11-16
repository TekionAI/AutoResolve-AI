
import api from './api';

export const scheduleService = {
  getSchedules: () => api.get('/schedules'),

  getServiceBays: () => api.get('/service-bays'),

  optimize: (dealershipId) =>
    api.post(`/schedules/optimize/${dealershipId}`),

  generateSchedule: (repairOrderId) =>
    api.post(`/schedules/generate/${repairOrderId}`),

  applyRecommendation: (recommendationId) =>
    api.put(`/schedules/apply-recommendation/${recommendationId}`)
};
