import axios from 'axios';

// Get API URL and ensure it ends with /api
let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// If the URL doesn't end with /api, append it
if (!API_BASE_URL.endsWith('/api')) {
  // Remove trailing slash if present, then add /api
  API_BASE_URL = API_BASE_URL.replace(/\/$/, '') + '/api';
}

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
