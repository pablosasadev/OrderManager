import axios from 'axios';

// Base URL of the backend API (matches the port from Visual Studio)
const API_URL = 'https://localhost:7068/api';

// Axios instance shared by all services
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the JWT to every outgoing request when present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Clear session and redirect to login on 401 responses
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

// Authentication endpoints
export const authService = {
  register: (
    email: string,
    password: string,
    fullName: string,
    role?: 'Admin' | 'Customer'
  ) => api.post('/auth/register', { email, password, fullName, role }),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

// Product endpoints
export const productService = {
  getAll: () => api.get('/products'),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: { name: string; description?: string; price: number; stock: number }) =>
    api.post('/products', data),
  update: (
    id: number,
    data: { id: number; name: string; description?: string; price: number; stock: number }
  ) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

// Order endpoints
export const orderService = {
  getAll: () => api.get('/orders'),
  getById: (id: number) => api.get(`/orders/${id}`),
  create: (data: { items: { productId: number; quantity: number }[] }) =>
    api.post('/orders', data),
  updateStatus: (id: number, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
};