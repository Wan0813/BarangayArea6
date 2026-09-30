/**
 * One wrapper function per API endpoint (docs/API.md).
 * Pages never call fetch or build URLs themselves.
 */
import { get, post, put, del, postForm } from './client';

/** Build a FormData payload, skipping empty values. */
export function toFormData(values, files = {}) {
  const fd = new FormData();
  Object.entries(values || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'boolean') {
      fd.append(key, value ? 'true' : 'false');
    } else {
      fd.append(key, String(value));
    }
  });
  Object.entries(files || {}).forEach(([key, file]) => {
    if (file) fd.append(key, file);
  });
  return fd;
}

/* ------------------------------- Auth ------------------------------ */

export const auth = {
  login: (usernameOrEmail, password) => post('/auth/login', { usernameOrEmail, password }),
  register: (values, validIdFile) =>
    postForm('/auth/register', toFormData(values, { validId: validIdFile })),
  forgotPassword: (email) => post('/auth/forgot-password', { email }),
  verifyResetCode: (email, code) => post('/auth/verify-reset-code', { email, code }),
  resetPassword: (payload) => post('/auth/reset-password', payload),
  me: () => get('/auth/me'),
  changePassword: (payload) => post('/auth/change-password', payload),
};

/* ------------------------------ Users ------------------------------ */

export const users = {
  list: (params) => get('/users', params),
  staffOptions: () => get('/users/staff-options'),
  get: (id) => get(`/users/${id}`),
  create: (payload) => post('/users', payload),
  update: (id, payload) => put(`/users/${id}`, payload),
  setStatus: (id, payload) => put(`/users/${id}/status`, payload),
  setRole: (id, payload) => put(`/users/${id}/role`, payload),
  setPosition: (id, payload) => put(`/users/${id}/position`, payload),
  uploadPhoto: (id, file) => postForm(`/users/${id}/photo`, toFormData({}, { photo: file })),
  remove: (id) => del(`/users/${id}`),
};

/* ---------------------------- Complaints --------------------------- */

export const complaints = {
  list: (params) => get('/complaints', params),
  get: (id) => get(`/complaints/${id}`),
  create: (values, image) => postForm('/complaints', toFormData(values, { image })),
  setStatus: (id, payload) => put(`/complaints/${id}/status`, payload),
  addComment: (id, payload) => post(`/complaints/${id}/comments`, payload),
  comments: (id) => get(`/complaints/${id}/comments`),
  remove: (id) => del(`/complaints/${id}`),
  stats: () => get('/complaints/stats'),
  types: () => get('/complaints/types'),
};

/* ---------------------------- Emergencies -------------------------- */

export const emergencies = {
  list: (params) => get('/emergencies', params),
  get: (id) => get(`/emergencies/${id}`),
  create: (values, image) => postForm('/emergencies', toFormData(values, { image })),
  setStatus: (id, payload) => put(`/emergencies/${id}/status`, payload),
  remove: (id) => del(`/emergencies/${id}`),
  stats: () => get('/emergencies/stats'),
};

/* ------------------------- Daily Operations ------------------------ */

export const operations = {
  list: (params) => get('/operations', params),
  get: (id) => get(`/operations/${id}`),
  create: (values, image) => postForm('/operations', toFormData(values, { image })),
  update: (id, values, image) => put(`/operations/${id}`, toFormData(values, { image })),
  publish: (id, isPublished) => put(`/operations/${id}/publish`, { isPublished }),
  remove: (id) => del(`/operations/${id}`),
};

/* --------------------------- Announcements ------------------------- */

export const announcements = {
  list: (params) => get('/announcements', params),
  get: (id) => get(`/announcements/${id}`),
  create: (values, image) => postForm('/announcements', toFormData(values, { image })),
  update: (id, values, image) => put(`/announcements/${id}`, toFormData(values, { image })),
  publish: (id, isPublished) => put(`/announcements/${id}/publish`, { isPublished }),
  remove: (id) => del(`/announcements/${id}`),
};

/* ------------------------------ Dashboard -------------------------- */

export const dashboard = {
  overview: () => get('/dashboard/overview'),
  dutyRoster: (date) => get('/dashboard/duty-roster', date ? { date } : undefined),
  householdsSummary: (params) => get('/dashboard/households-summary', params),
};

/* ----------------------------- Households -------------------------- */

export const households = {
  list: (params) => get('/households', params),
  get: (id) => get(`/households/${id}`),
  create: (payload) => post('/households', payload),
  update: (id, payload) => put(`/households/${id}`, payload),
  remove: (id) => del(`/households/${id}`),
  addMember: (id, payload) => post(`/households/${id}/members`, payload),
  updateMember: (memberId, payload) => put(`/households/members/${memberId}`, payload),
  removeMember: (memberId) => del(`/households/members/${memberId}`),
};

/* ---------------------------- Duty Roster -------------------------- */

export const dutyRoster = {
  list: (params) => get('/duty-roster', params),
  create: (payload) => post('/duty-roster', payload),
  update: (id, payload) => put(`/duty-roster/${id}`, payload),
  remove: (id) => del(`/duty-roster/${id}`),
};

/* ------------------------------- About ----------------------------- */

export const about = {
  get: () => get('/about'),
  update: (payload) => put('/about', payload),
  hotlines: () => get('/about/hotlines'),
  createHotline: (payload) => post('/about/hotlines', payload),
  updateHotline: (id, payload) => put(`/about/hotlines/${id}`, payload),
  removeHotline: (id) => del(`/about/hotlines/${id}`),
  organization: () => get('/about/organization'),
  createOrg: (values, photo) => postForm('/about/organization', toFormData(values, { photo })),
  updateOrg: (id, values, photo) => put(`/about/organization/${id}`, toFormData(values, { photo })),
  removeOrg: (id) => del(`/about/organization/${id}`),
};

/* ------------------------------ Profile ---------------------------- */

export const profile = {
  /** Self service endpoints (any authenticated role). */
  updateMe: (payload) => put('/auth/profile', payload),
  uploadMyPhoto: (file) => postForm('/auth/photo', toFormData({}, { photo: file })),
  changePassword: (payload) => post('/auth/change-password', payload),
  /** Fallback for builds that only expose PUT /api/users/{id}. */
  update: (id, payload) => put(`/users/${id}`, payload),
  uploadPhoto: (id, file) => postForm(`/users/${id}/photo`, toFormData({}, { photo: file })),
};

export const publicApi = {
  info: () => get('/public/info'),
  hotlines: () => get('/public/hotlines'),
  organization: () => get('/public/organization'),
};

export const api = {
  auth,
  users,
  complaints,
  emergencies,
  operations,
  announcements,
  dashboard,
  households,
  dutyRoster,
  about,
  profile,
  publicApi,
};

export default api;
