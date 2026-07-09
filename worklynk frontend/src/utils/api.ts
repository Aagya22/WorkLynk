import axios from 'axios';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return `http://${hostname}:5001`;
  }
  return 'http://localhost:5001';
};

const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL || getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept responses to handle token expiration (401 status)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Avoid infinite loop if refresh token request itself fails
    if (error.response?.status === 401 && originalRequest.url === '/api/auth/refresh') {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      originalRequest.url !== '/api/auth/login' &&
      originalRequest.url !== '/api/auth/me' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        await api.post('/api/auth/refresh');
        return api(originalRequest);
      } catch (refreshError) {
        // Clear cached user and redirect to login
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
