import api from './api';

export const availabilityService = {
  async get() {
    const response = await api.get('/availability');
    return response.data;
  },

  async save(availability) {
    const response = await api.post('/availability', { availability });
    return response.data;
  },
};
