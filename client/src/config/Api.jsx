import axios from "axios";
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: "http://localhost:4500",
  withCredentials: true,
});


// Add a request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    // Add no-cache headers to avoid stale 304 responses, and append a timestamp to GET requests
    if (!config.headers) config.headers = {};
    config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    config.headers["Pragma"] = "no-cache";
    config.headers["Expires"] = "0";
    if (config.method && config.method.toLowerCase() === 'get') {
      const url = new URL(config.url, config.baseURL || window.location.origin);
      url.searchParams.set('_ts', Date.now().toString());
      config.url = url.pathname + url.search;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Centralized response interceptor to handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    // If token is invalid or expired -> force logout
    if (status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {
        // ignore
      }
      try { window.location.href = '/login'; } catch (e) {}
      return Promise.reject(error);
    }

    // 403 Forbidden -> user is authenticated but not authorized for this resource.
    // Don't clear credentials; show a friendly message and optionally send to /unauthorized
    if (status === 403) {
      try {
        toast.error('You are not authorized to access this resource');
        // navigate to an Unauthorized page if present (non-destructive)
        try { window.location.href = '/unauthorized'; } catch (e) {}
      } catch (e) {
        // ignore toast failures
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;