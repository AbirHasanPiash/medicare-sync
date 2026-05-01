import axios from 'axios';

// Create the Axios instance with a base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a Request Interceptor to include the token in the Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // If a token exists, attach it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// SWR needs this generic fetcher function to resolve promises into JSON data
export const fetcher = (url) => api.get(url).then((res) => res.data);

export default api;
