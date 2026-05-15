import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token
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

// Response interceptor for 401/403 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors (401 = no token, 403 = invalid/expired token)
    if (error.response?.status === 401 || error.response?.status === 403) {
      const errorMessage = error.response?.data?.error || '';
      // Only auto-logout on authentication errors, not permission errors
      if (
        error.response.status === 401 ||
        errorMessage.includes('Invalid or expired token') ||
        errorMessage.includes('Access token required')
      ) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export async function registerUser(name: string, email: string, password: string) {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
}

export async function loginUser(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
}

export default api;
