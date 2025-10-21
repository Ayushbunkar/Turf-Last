import axios from "axios";

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
    if (status === 401 || status === 403) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {
        // ignore
      }
      // Show a simple alert / fallback — individual components may also show toasts
      try { window.location.href = '/login'; } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export default api;