import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor for adding the bearer token
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

// Response interceptor for handling token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // Attempt to refresh the token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: refreshToken,
          });

          if (response.data && response.data.code === 0) {
            const { token, refreshToken: newRefreshToken, exp } = response.data.data;
            
            // Save new tokens
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', newRefreshToken);
            localStorage.setItem('exp', exp);

            // Retry the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails, clear tokens and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('exp');
          localStorage.removeItem('role');
          window.location.href = '/v2/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, redirect to login
        window.location.href = '/v2/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
