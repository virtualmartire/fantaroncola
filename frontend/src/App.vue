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
  <div class="app-shell">
    <header class="main-nav">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-8">
          <RouterLink to="/" class="nav-brand text-xl font-black tracking-tight">
            FantaRoncola
          </RouterLink>

          <nav class="hidden items-center gap-6 sm:flex">
            <RouterLink to="/" class="nav-link text-sm font-medium transition">
              Inizio
            </RouterLink>
            <RouterLink
              v-if="authStore.isAuthenticated"
              to="/team"
              class="nav-link text-sm font-medium transition"
            >
              La mia squadra
            </RouterLink>
            <RouterLink
              v-if="authStore.isAuthenticated"
              to="/leaderboard"
              class="nav-link text-sm font-medium transition"
            >
              Classifica
            </RouterLink>
            <RouterLink
              v-if="authStore.user?.is_admin"
              to="/admin"
              class="nav-link text-sm font-medium transition"
            >
              Admin
            </RouterLink>
          </nav>
        </div>

        <div class="hidden items-center gap-4 sm:flex">
          <template v-if="authStore.isAuthenticated">
            <span class="gold-copy text-sm">
              Benvenuto, <span class="font-semibold">{{ authStore.user?.username }}</span>
            </span>
            <button
              @click="handleLogout"
              class="ghost-button rounded-xl px-4 py-2 text-sm font-medium transition"
            >
              Esci
            </button>
          </template>

          <RouterLink
            v-else
            to="/accedi"
            class="gold-button inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition"
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
