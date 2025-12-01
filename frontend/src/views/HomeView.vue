<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const isRegistering = ref(false);
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');

const handleAuth = async () => {
  error.value = '';
  
  if (isRegistering.value && password.value !== confirmPassword.value) {
    error.value = "Passwords do not match";
    return;
  }

  try {
    if (isRegistering.value) {
        await authStore.register(username.value, password.value);
    } else {
        await authStore.login(username.value, password.value);
    }
    // Redirect if needed or just refresh state (authStore.user will be set)
    if (authStore.isAuthenticated) {
        // Stay on home or redirect to team?
        // The requirement says "fuse home, login and register", implies this IS the landing.
        // Maybe we don't need to route push anywhere if we are already at /
    }
  } catch (err) {
    error.value = err.message;
  }
};

const toggleMode = () => {
    isRegistering.value = !isRegistering.value;
    error.value = '';
    username.value = '';
    password.value = '';
    confirmPassword.value = '';
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h1 class="text-center text-4xl font-extrabold text-indigo-600">FantaRoncola</h1>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ authStore.isAuthenticated ? 'Welcome Back!' : (isRegistering ? 'Create your account' : 'Sign in to your account') }}
        </h2>
      </div>

      <div v-if="authStore.isAuthenticated" class="text-center space-y-4">
        <p class="text-lg">You are logged in as <span class="font-bold">{{ authStore.user?.username }}</span></p>
        <div class="flex justify-center space-x-4">
            <router-link to="/team" class="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700">Manage Team</router-link>
            <router-link to="/leaderboard" class="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700">Leaderboard</router-link>
        </div>
      </div>

      <form v-else class="mt-8 space-y-6" @submit.prevent="handleAuth">
        <input type="hidden" name="remember" value="true">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="username" class="sr-only">Username</label>
            <input id="username" name="username" type="text" required v-model="username" class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Username">
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input id="password" name="password" type="password" required v-model="password" class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" :class="isRegistering ? '' : 'rounded-b-md'" placeholder="Password">
          </div>
          <div v-if="isRegistering">
            <label for="confirm-password" class="sr-only">Confirm Password</label>
            <input id="confirm-password" name="confirm-password" type="password" required v-model="confirmPassword" class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Confirm Password">
          </div>
        </div>

        <div v-if="error" class="text-red-500 text-sm text-center">
          {{ error }}
        </div>

        <div>
          <button type="submit" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            {{ isRegistering ? 'Register' : 'Sign in' }}
          </button>
        </div>
        <div class="text-center text-sm">
          <button type="button" @click="toggleMode" class="font-medium text-indigo-600 hover:text-indigo-500">
            {{ isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
