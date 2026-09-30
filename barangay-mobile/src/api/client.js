import AsyncStorage from '@react-native-async-storage/async-storage';

import { config } from '../config';

export const SESSION_KEY = 'bmis.session';

let unauthorizedHandler = null;

/**
 * AuthContext registers a callback here so that a 401 response can clear the
 * in-memory session and bounce the user back to the login screen.
 */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export async function getToken() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session && session.token ? session.token : null;
  } catch (e) {
    return null;
  }
}

function buildUrl(path, params) {
  const base = String(config.apiBaseUrl || '').replace(/\/+$/, '');
  const cleanPath = String(path || '').startsWith('/') ? path : `/${path}`;
  let url = `${base}${cleanPath}`;
  if (params && typeof params === 'object') {
    const parts = [];
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value === undefined || value === null || value === '') return;
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    });
    if (parts.length > 0) url += `?${parts.join('&')}`;
  }
  return url;
}

function extractMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (payload.message) return payload.message;
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    const first = payload.errors[0];
    if (typeof first === 'string') return first;
    if (first && first.message) return first.message;
  }
  return fallback;
}

async function handleUnauthorized() {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (e) {
    // ignore storage failures
  }
  if (typeof unauthorizedHandler === 'function') {
    try {
      unauthorizedHandler();
    } catch (e) {
      // ignore handler failures
    }
  }
}

async function request(method, path, { params, body, form } = {}) {
  const url = buildUrl(path, params);
  const headers = { Accept: 'application/json' };

  const token = await getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = form; // FormData — let fetch/RN set the multipart boundary.
  } else if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, { method, headers, body: payload });
  } catch (networkError) {
    throw new Error(
      `Cannot reach the server. Check your connection and the API base URL in src/config.js. (${networkError.message})`
    );
  }

  if (response.status === 401) {
    await handleUnauthorized();
  }

  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (e) {
      json = null;
    }
  }

  // Non-enveloped response (e.g. 204, plain text, HTML error page).
  if (json === null) {
    if (!response.ok) {
      throw new Error(
        `Request failed (${response.status}). ${text ? String(text).slice(0, 200) : ''}`.trim()
      );
    }
    return null;
  }

  if (json.success === false) {
    throw new Error(extractMessage(json, `Request failed (${response.status}).`));
  }

  if (!response.ok && json.success !== true) {
    throw new Error(extractMessage(json, `Request failed (${response.status}).`));
  }

  return json.data === undefined ? null : json.data;
}

export function get(path, params) {
  return request('GET', path, { params });
}

export function post(path, body) {
  return request('POST', path, { body });
}

export function put(path, body) {
  return request('PUT', path, { body });
}

export function del(path, body) {
  return request('DELETE', path, { body });
}

/**
 * Sends multipart/form-data. `fields` is a plain object of primitive values;
 * any value that is a `{ uri, name, type }` file descriptor is appended as a
 * file part. `fileField` names the (single) file field, or pass
 * `fileFields` for multiple.
 */
export function postForm(path, fields = {}, fileField = null, file = null) {
  const form = new FormData();

  Object.keys(fields).forEach((key) => {
    if (key === '__files') return;
    const value = fields[key];
    if (value === undefined || value === null) return;
    form.append(key, String(value));
  });

  const appendFile = (field, asset) => {
    if (!asset) return;
    const uri = typeof asset === 'string' ? asset : asset.uri;
    if (!uri) return;
    form.append(field, {
      uri,
      name: (asset && asset.fileName) || (asset && asset.name) || `${field}-${Date.now()}.jpg`,
      type: (asset && asset.mimeType) || (asset && asset.type) || 'image/jpeg',
    });
  };

  if (fileField) appendFile(fileField, file);
  if (fields.__files && typeof fields.__files === 'object') {
    Object.keys(fields.__files).forEach((field) => appendFile(field, fields.__files[field]));
  }

  return request('POST', path, { form });
}

export function putForm(path, fields = {}, fileField = null, file = null) {
  const form = new FormData();
  Object.keys(fields).forEach((key) => {
    const value = fields[key];
    if (value === undefined || value === null) return;
    form.append(key, String(value));
  });
  if (fileField && file) {
    const uri = typeof file === 'string' ? file : file.uri;
    if (uri) {
      form.append(fileField, {
        uri,
        name: file.fileName || file.name || `${fileField}-${Date.now()}.jpg`,
        type: file.mimeType || file.type || 'image/jpeg',
      });
    }
  }
  return request('PUT', path, { form });
}

/** Turns a relative `/uploads/...` path from the API into an absolute URL. */
export function resolveFileUrl(path) {
  if (!path) return null;
  const value = String(path);
  if (/^https?:\/\//i.test(value)) return value;
  const base = String(config.fileBaseUrl || '').replace(/\/+$/, '');
  const clean = value.startsWith('/') ? value : `/${value}`;
  return `${base}${clean}`;
}

export default { get, post, put, del, postForm, putForm, resolveFileUrl, setUnauthorizedHandler, getToken, SESSION_KEY };
