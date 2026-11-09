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
