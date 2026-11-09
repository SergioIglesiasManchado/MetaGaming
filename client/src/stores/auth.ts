import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserProfile, AuthResponse } from '../types/auth';

const getStorageItem = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Ignore in non-browser or disabled environments
  }
  return null;
};

const setStorageItem = (key: string, value: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore in non-browser or disabled environments
  }
};

const removeStorageItem = (key: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore in non-browser or disabled environments
  }
};

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getStorageItem('mg_token'));
  const rawUser = getStorageItem('mg_user');
  const user = ref<UserProfile | null>(rawUser ? JSON.parse(rawUser) : null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => Boolean(token.value && user.value));
  const isAdmin = computed(() => Boolean(user.value?.is_admin || user.value?.role === 'admin'));

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const setAuth = (newUser: UserProfile, newToken: string) => {
    user.value = newUser;
    token.value = newToken;
    setStorageItem('mg_token', newToken);
    setStorageItem('mg_user', JSON.stringify(newUser));
  };

  const clearAuth = () => {
    user.value = null;
    token.value = null;
    removeStorageItem('mg_token');
    removeStorageItem('mg_user');
  };

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setAuth(data.data.user, data.data.token);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred during login';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setAuth(data.data.user, data.data.token);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred during registration';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    clearAuth();
  };

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    setAuth,
    clearAuth
  };
});
