export const API_URL = import.meta.env.VITE_API_URL || 'https://vibe-pass-yd40.onrender.com';

export function apiUrl(path = '') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
}

export function apiFetch(path, options) {
  return fetch(apiUrl(path), options);
}

export function getImageUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}
