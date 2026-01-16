import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(name, email, password, timezone = 'UTC') {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      timezone,
    });
    return response.data;
  },
};
