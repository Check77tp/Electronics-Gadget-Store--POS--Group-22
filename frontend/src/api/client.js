import axios from 'axios';

// Base URL for the GadgetPOS FastAPI backend. Per API_REFERENCE.md, every
// endpoint except /api/auth/login and /api/health requires a bearer token.
//
// Reads VITE_API_BASE_URL at build time (Vite bakes import.meta.env.VITE_*
// values into the build, so this is resolved when `npm run build` runs, not
// at runtime in the browser). Set VITE_API_BASE_URL as an environment
// variable on Netlify to point production at the deployed Render backend;
// leave it unset locally and this falls back to localhost so `npm run dev`
// keeps working against your local backend with zero extra setup.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the stored JWT to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('gadgetpos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 means the token is missing/invalid/expired: clear auth state and
// bounce to /login. We don't try to refresh — per API_REFERENCE.md the JWT
// is never expiry-checked client side, we just attach it and let 401s redirect.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('gadgetpos_token');
      localStorage.removeItem('gadgetpos_user');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

// Pulls the human-readable message out of the backend's error shape
// ({"detail": "..."}) so callers never have to dump raw JSON in the UI.
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    // FastAPI validation errors come back as a list of {msg, loc, ...}
    return detail.map((d) => d.msg || JSON.stringify(d)).join('; ');
  }
  if (error?.message === 'Network Error') {
    return 'Cannot reach the server. Check that the backend is running.';
  }
  return fallback;
}

export default apiClient;