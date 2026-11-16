
import api from './api';

export const recommendationService = {
  getRecommendations: () => api.get('/recommendations'),

  generateSourcingRecs: (roId) =>
    api.post(`/recommendations/generate/${roId}`),

  approveRecommendation: (id, status = 'Approved') =>
    api.put(`/approvals/${id}/review`, { status }),

  applyRecommendation: (id) =>
    api.put(`/apply-recommendations/${id}/apply`),
};
