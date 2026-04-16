<script setup>
import { ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleLogout = () => {
  closeMobileMenu()
  authStore.logout()
  router.push('/')
}

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu()
  }
)
</script>

<template>
  <div class="app-shell flex min-h-screen flex-col">
    <header class="main-nav">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex min-h-16 items-center justify-between gap-4">
          <div class="flex items-center gap-8">
            <RouterLink to="/" class="nav-brand text-xl font-black tracking-tight" @click="closeMobileMenu">
              FantaRoncola
            </RouterLink>

            <nav class="hidden items-center gap-6 sm:flex">
              <RouterLink to="/" class="nav-link text-sm font-medium transition">
                Inizio
              </RouterLink>
              <RouterLink to="/regolamento" class="nav-link text-sm font-medium transition">
                Regolamento
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
                v-if="authStore.isAuthenticated"
                to="/punteggi-cantanti"
                class="nav-link text-sm font-medium transition"
              >
                Punti cantanti
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

          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(224,191,115,0.18)] bg-[rgba(255,236,191,0.04)] text-[#f4deb1] transition hover:bg-[rgba(255,236,191,0.08)] sm:hidden"
            :aria-expanded="isMobileMenuOpen"
            aria-controls="mobile-menu"
            :aria-label="isMobileMenuOpen ? 'Chiudi menu' : 'Apri menu'"
            @click="toggleMobileMenu"
          >
            <svg
              v-if="!isMobileMenuOpen"
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            >
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
            <svg
              v-else
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div
          v-if="isMobileMenuOpen"
          id="mobile-menu"
          class="border-t border-[rgba(224,191,115,0.12)] pb-4 pt-3 sm:hidden"
        >
          <nav class="flex flex-col gap-1">
            <RouterLink
              to="/"
              class="nav-link rounded-xl px-3 py-2 text-sm font-medium transition"
              @click="closeMobileMenu"
            >
              Inizio
            </RouterLink>
            <RouterLink
              to="/regolamento"
              class="nav-link rounded-xl px-3 py-2 text-sm font-medium transition"
              @click="closeMobileMenu"
            >
              Regolamento
            </RouterLink>
            <RouterLink
              v-if="authStore.isAuthenticated"
              to="/team"
              class="nav-link rounded-xl px-3 py-2 text-sm font-medium transition"
              @click="closeMobileMenu"
            >
              La mia squadra
            </RouterLink>
            <RouterLink
              v-if="authStore.isAuthenticated"
              to="/leaderboard"
              class="nav-link rounded-xl px-3 py-2 text-sm font-medium transition"
              @click="closeMobileMenu"
            >
              Classifica
            </RouterLink>
            <RouterLink
              v-if="authStore.isAuthenticated"
              to="/punteggi-cantanti"
              class="nav-link rounded-xl px-3 py-2 text-sm font-medium transition"
              @click="closeMobileMenu"
            >
              Punti cantanti
            </RouterLink>
            <RouterLink
              v-if="authStore.user?.is_admin"
              to="/admin"
              class="nav-link rounded-xl px-3 py-2 text-sm font-medium transition"
              @click="closeMobileMenu"
            >
              Admin
            </RouterLink>
          </nav>

          <div class="mt-3 border-t border-[rgba(224,191,115,0.12)] pt-3">
            <template v-if="authStore.isAuthenticated">
              <p class="gold-copy px-3 text-sm">
                Benvenuto, <span class="font-semibold">{{ authStore.user?.username }}</span>
              </p>
              <button
                @click="handleLogout"
                class="ghost-button mt-3 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition"
              >
                Esci
              </button>
            </template>

            <RouterLink
              v-else
              to="/accedi"
              class="gold-button inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition"
              @click="closeMobileMenu"
            >
              Accedi o registrati
            </RouterLink>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <RouterView />
      </div>
    </main>

    <footer class="site-footer">
      <div class="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <p class="text-center text-xs tracking-wide text-[var(--text-faint)]">
          Sviluppato da
          <a
            href="https://stefano.martire.xyz"
            class="text-[var(--text-faint)] transition hover:text-[var(--text-soft)]"
            target="_blank"
            rel="noopener noreferrer"
          >
            Stefano Martire
          </a>
        </p>
      </div>
    </footer>
  </div>
</template>
