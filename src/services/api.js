import axios from 'axios';

const api = axios.create({
  baseURL: 'https://travelmanagement-spring-boot-api.onrender.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error details:', error);
    // Standardize error messaging
    const customError = new Error(
      error.response?.data?.message || 
      error.response?.data || 
      error.message || 
      'An unexpected network error occurred.'
    );
    customError.status = error.response?.status;
    customError.data = error.response?.data;
    return Promise.reject(customError);
  }
);

export default api;
