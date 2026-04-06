import axios from 'axios';

const apiBaseUrl = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('monur10_token');
      localStorage.removeItem('monur10_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;