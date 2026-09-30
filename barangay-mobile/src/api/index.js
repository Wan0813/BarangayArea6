import { config } from '../config';
import { get, post, put, del, resolveFileUrl, assetToDataUrl } from './client';

export { resolveFileUrl };

const P = config.apiBaseUrl;

/* ------------------------------------------------------------------ auth */

export const auth = {
  /** JSON + base64 data URL — `asset` is the valid ID image from expo-image-picker. */
  register(fields, idAsset) {
    const { validId, ...rest } = fields;
    return post('/auth/register', { ...rest, validIdType: fields.validIdType, validIdImagePath: assetToDataUrl(idAsset) });
  },
  login(usernameOrEmail, password) {
    return post('/auth/login', { usernameOrEmail, password });
  },
  forgotPassword(email) {
    return post('/auth/forgot-password', { email });
  },
  verifyResetCode(email, code) {
    return post('/auth/verify-reset-code', { email, code });
  },
  resetPassword(email, code, newPassword, confirmPassword) {
    return post('/auth/reset-password', { email, code, newPassword, confirmPassword });
  },
  me() {
    return get('/auth/me');
  },
  changePassword(currentPassword, newPassword, confirmPassword) {
    return post('/auth/change-password', { currentPassword, newPassword, confirmPassword });
  },
};

/* ------------------------------------------------------------ complaints */

export const complaints = {
  list(params) {
    return get('/complaints', params);
  },
  getById(id) {
    return get(`/complaints/${id}`);
  },
  /** JSON + optional base64 image. */
  create(fields, imageAsset) {
    return post('/complaints', { ...fields, imagePath: imageAsset ? assetToDataUrl(imageAsset) : null });
  },
  comments(id) {
    return get(`/complaints/${id}/comments`);
  },
  addComment(id, message, status) {
    const body = { message };
    if (status) body.status = status;
    return post(`/complaints/${id}/comments`, body);
  },
  types() {
    return get('/complaints/types');
  },
  stats() {
    return get('/complaints/stats');
  },
};

/* ----------------------------------------------------------- emergencies */

export const emergencies = {
  list(params) {
    return get('/emergencies', params);
  },
  getById(id) {
    return get(`/emergencies/${id}`);
  },
  /** JSON + optional base64 image. */
  create(fields, imageAsset) {
    return post('/emergencies', { ...fields, imagePath: imageAsset ? assetToDataUrl(imageAsset) : null });
  },
  stats() {
    return get('/emergencies/stats');
  },
};

/* ------------------------------------------------------------ operations */

export const operations = {
  list(params) {
    return get('/operations', params);
  },
  getById(id) {
    return get(`/operations/${id}`);
  },
};

/* --------------------------------------------------------- announcements */

export const announcements = {
  list(params) {
    return get('/announcements', params);
  },
  getById(id) {
    return get(`/announcements/${id}`);
  },
};

/* ----------------------------------------------------------------- about */

export const about = {
  get() {
    return get('/about');
  },
  hotlines() {
    return get('/about/hotlines');
  },
  organization() {
    return get('/about/organization');
  },
};

/* --------------------------------------------------------------- public */

export const publicApi = {
  info() {
    return get('/public/info');
  },
  hotlines() {
    return get('/public/hotlines');
  },
  organization() {
    return get('/public/organization');
  },
  announcements(params) {
    return get('/public/announcements', params);
  },
  statistics() {
    return get('/public/statistics');
  },
  downloads() {
    return get('/public/downloads');
  },
};

/* -------------------------------------------------------------- profile */

export const profile = {
  /** Update the signed-in user's own profile (any role). */
  update(fields) {
    return put('/auth/profile', fields);
  },
  /** Upload the signed-in user's own profile photo (base64 data URL in JSON). */
  uploadPhoto(asset) {
    return post('/auth/photo', { photo: assetToDataUrl(asset) });
  },
  /** Head admin variant: update another account by id. */
  updateById(id, fields) {
    return put(`/users/${id}`, fields);
  },
};

export default {
  auth,
  complaints,
  emergencies,
  operations,
  announcements,
  about,
  publicApi,
  profile,
  resolveFileUrl,
  url: P,
};
