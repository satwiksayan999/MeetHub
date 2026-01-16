import api from './api';

export const meetingsService = {
  async getUpcoming() {
    const response = await api.get('/meetings/upcoming');
    return response.data;
  },

  async getPast() {
    const response = await api.get('/meetings/past');
    return response.data;
  },

  async cancel(id) {
    const response = await api.put(`/meetings/${id}/cancel`);
    return response.data;
  },
};
