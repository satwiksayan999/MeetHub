import api from './api';

export const publicService = {
  async getEventType(slug) {
    const response = await api.get(`/public/${slug}`);
    return response.data;
  },

  async getAvailableSlots(slug, date) {
    const response = await api.get(`/public/${slug}/available-slots`, {
      params: { date },
    });
    return response.data;
  },

  async book(slug, data) {
    const response = await api.post(`/public/${slug}/book`, data);
    return response.data;
  },
};
