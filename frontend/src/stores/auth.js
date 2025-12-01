import { defineStore } from 'pinia';
import { api } from '../services/api';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('token') || null);
  const isAuthenticated = computed(() => !!token.value);

  async function register(username, password) {
    try {
      const data = await api.post('/auth/register', { username, password });
      token.value = data.token;
      user.value = data.user;
      localStorage.setItem('token', data.token);
    } catch (error) {
      throw error;
    }
  }

  async function login(username, password) {
    try {
      const data = await api.post('/auth/login', { username, password });
      token.value = data.token;
      user.value = data.user;
      localStorage.setItem('token', data.token);
    } catch (error) {
      throw error;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  }

  async function fetchUser() {
    if (!token.value) return;
    try {
      const data = await api.get('/auth/me', token.value);
      user.value = data;
    } catch (error) {
      logout();
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    register,
    login,
    logout,
    fetchUser
  };
});
