/**
 * Centralized API configuration for MetaGaming client.
 *
 * In production builds (e.g. on Vercel), localhost addresses configured in
 * environment variables are discarded in favor of same-origin relative paths (""),
 * ensuring requests stay on the Vercel project domain and do not attempt to reach
 * local devices.
 */
const rawUrl = (import.meta.env.VITE_API_URL || '').trim();

export const apiBaseUrl =
  import.meta.env.PROD && (rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1'))
    ? ''
    : rawUrl;

export const getApiUrl = (endpoint: string): URL => {
  const base =
    apiBaseUrl ||
    (typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'http://localhost:3000');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return new URL(`${apiBaseUrl}${path}`, base);
};

export const parseJsonResponse = async <T = any>(res: Response): Promise<T> => {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    if (!res.ok) {
      throw new Error(`Server error (${res.status}): ${text.trim() || res.statusText}`);
    }
    throw new Error('Invalid JSON response received from server');
  }
};

