import axios from 'axios';

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('taw_api_base_url');
    if (saved) return saved;

    // If running on Vercel, use configured VITE_API_BASE_URL or default to live Render backend
    if (window.location.hostname.includes('vercel.app')) {
      const envUrl = import.meta.env.VITE_API_BASE_URL;
      if (envUrl && !envUrl.includes('localhost')) {
        return envUrl;
      }
      return 'https://taw-api-y52z.onrender.com/api';
    }
  }
  return import.meta.env.VITE_API_BASE_URL || '/api';
}

export function setApiBaseUrl(url) {
  if (typeof window !== 'undefined') {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem('taw_api_base_url', cleanUrl);
    api.defaults.baseURL = cleanUrl;
  }
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Authorization header if token exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taw_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('taw_admin_token');
      localStorage.removeItem('taw_admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export async function login(email, password) {
  const res = await api.post('/admin/auth/login', { email, password });
  return res.data.data;
}

export async function logout() {
  try {
    await api.post('/admin/auth/logout');
  } finally {
    localStorage.removeItem('taw_admin_token');
    localStorage.removeItem('taw_admin_user');
  }
}

export async function getMe() {
  const res = await api.get('/admin/auth/me');
  return res.data.data;
}

// Dashboard
export async function getDashboardStats() {
  const res = await api.get('/admin/dashboard/stats');
  return res.data.data;
}

export async function getDashboardActivity() {
  const res = await api.get('/admin/dashboard/activity');
  return res.data.data;
}

// Submissions
export async function getSubmissions(params = {}) {
  const res = await api.get('/admin/submissions', { params });
  return res.data;
}

export async function getSubmissionById(id) {
  const res = await api.get(`/admin/submissions/${id}`);
  return res.data.data;
}

export async function approveSubmission(id, { note, editedPublicContent }) {
  const res = await api.post(`/admin/submissions/${id}/approve`, { note, editedPublicContent });
  return res.data.data;
}

export async function rejectSubmission(id, { reason, note }) {
  const res = await api.post(`/admin/submissions/${id}/reject`, { reason, note });
  return res.data.data;
}

export async function updateSubmission(id, data) {
  const res = await api.patch(`/admin/submissions/${id}`, data);
  return res.data.data;
}

// Publications
export async function getPublications(params = {}) {
  const res = await api.get('/admin/publications', { params });
  return res.data;
}

export async function removePublication(id, reason) {
  const res = await api.post(`/admin/publications/${id}/remove`, { reason });
  return res.data.data;
}

export async function retryPublication(id) {
  const res = await api.post(`/admin/publications/${id}/retry`);
  return res.data.data;
}

// Reports
export async function getReports(params = {}) {
  const res = await api.get('/admin/reports', { params });
  return res.data;
}

export async function resolveReport(id, { resolutionNotes, removePost }) {
  const res = await api.post(`/admin/reports/${id}/resolve`, { resolutionNotes, removePost });
  return res.data.data;
}

export async function dismissReport(id, note) {
  const res = await api.post(`/admin/reports/${id}/dismiss`, { note });
  return res.data.data;
}

// Users
export async function getUsers(params = {}) {
  const res = await api.get('/admin/users', { params });
  return res.data;
}

export async function blockUser(id, reason) {
  const res = await api.post(`/admin/users/${id}/block`, { reason });
  return res.data.data;
}

export async function unblockUser(id) {
  const res = await api.post(`/admin/users/${id}/unblock`);
  return res.data.data;
}

// Administrators
export async function getAdministrators() {
  const res = await api.get('/admin/administrators');
  return res.data.data;
}

export async function createAdministrator(data) {
  const res = await api.post('/admin/administrators', data);
  return res.data.data;
}

export async function updateAdministrator(id, data) {
  const res = await api.patch(`/admin/administrators/${id}`, data);
  return res.data.data;
}

// Settings
export async function getSettings() {
  const res = await api.get('/admin/settings');
  return res.data.data;
}

export async function updateSettings(data) {
  const res = await api.patch('/admin/settings', data);
  return res.data.data;
}

export function getAttachmentImageUrl(attachmentId, token) {
  const base = getApiBaseUrl();
  const cleanBase = base.replace(/\/+$/, '');
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${cleanBase}/admin/attachments/${attachmentId}/image${tokenQuery}`;
}

export default api;
