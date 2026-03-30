<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-gray-900">
    <header class="border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-8">
          <RouterLink to="/" class="text-xl font-black tracking-tight text-indigo-600">
            FantaRoncola
          </RouterLink>

          <nav class="hidden items-center gap-6 sm:flex">
            <RouterLink to="/" class="text-sm font-medium text-gray-600 transition hover:text-indigo-600">
              Inizio
            </RouterLink>
            <RouterLink
              v-if="authStore.isAuthenticated"
              to="/team"
              class="text-sm font-medium text-gray-600 transition hover:text-indigo-600"
            >
              La mia squadra
            </RouterLink>
            <RouterLink
              v-if="authStore.isAuthenticated"
              to="/leaderboard"
              class="text-sm font-medium text-gray-600 transition hover:text-indigo-600"
            >
              Classifica
            </RouterLink>
            <RouterLink
              v-if="authStore.user?.is_admin"
              to="/admin"
              class="text-sm font-medium text-gray-600 transition hover:text-indigo-600"
            >
              Admin
            </RouterLink>
          </nav>
        </div>

        <div class="hidden items-center gap-4 sm:flex">
          <template v-if="authStore.isAuthenticated">
            <span class="text-sm text-gray-700">
              Benvenuto, <span class="font-semibold">{{ authStore.user?.username }}</span>
            </span>
            <button
              @click="handleLogout"
              class="text-sm font-medium text-gray-500 transition hover:text-gray-800"
            >
              Esci
            </button>
          </template>

          <RouterLink
            v-else
            to="/accedi"
            class="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Accedi o registrati
          </RouterLink>
        </div>
      </div>
    </header>

    <main>
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <RouterView />
      </div>
    </main>
  </div>
</template>
