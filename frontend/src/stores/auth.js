import { defineStore } from 'pinia';
import { api } from '../services/api';
import { ref, computed } from 'vue';

const LEGACY_TOKEN_STORAGE_KEY = 'token';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const hasInitialized = ref(false);
  const isInitializing = ref(false);
  const isAuthenticated = computed(() => !!user.value);
  let initializationPromise = null;

  const clearLegacyToken = () => {
    localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  };

  async function register(username, password, captcha) {
    try {
      const data = await api.post('/auth/register', { username, password, captcha });
      user.value = data.user;
      hasInitialized.value = true;
      clearLegacyToken();
    } catch (error) {
      throw error;
    }
  }

  async function login(username, password) {
    try {
      const data = await api.post('/auth/login', { username, password });
      user.value = data.user;
      hasInitialized.value = true;
      clearLegacyToken();
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout', {});
    } catch (error) {
      console.error('Errore durante il logout:', error);
    } finally {
      user.value = null;
      hasInitialized.value = true;
      clearLegacyToken();
    }
  }

  async function fetchUser(legacyToken = null) {
    try {
      const data = await api.get('/auth/me', legacyToken);
      user.value = data;
      return data;
    } catch (error) {
      user.value = null;
      throw error;
    }
  }

  async function initializeAuth() {
    if (hasInitialized.value) {
      return user.value;
    }

    if (initializationPromise) {
      return initializationPromise;
    }

    initializationPromise = (async () => {
      isInitializing.value = true;
      const legacyToken = localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY);

      try {
        await fetchUser(legacyToken);
      } catch {
        user.value = null;
      } finally {
        clearLegacyToken();
        hasInitialized.value = true;
        isInitializing.value = false;
        initializationPromise = null;
      }

      return user.value;
    })();

    return initializationPromise;
  }

  return {
    user,
    hasInitialized,
    isInitializing,
    isAuthenticated,
    register,
    login,
    logout,
    fetchUser,
    initializeAuth,
  };
});
