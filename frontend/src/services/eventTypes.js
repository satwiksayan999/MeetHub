import api from './api';

export const eventTypesService = {
  async getAll() {
    const response = await api.get('/event-types');
    return response.data;
  },

  async create(data) {
    const response = await api.post('/event-types', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/event-types/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/event-types/${id}`);
    return response.data;
  },
};
