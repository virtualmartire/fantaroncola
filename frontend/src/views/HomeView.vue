<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const isRegistering = ref(false)
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')

const title = computed(() => {
  if (isRegistering.value) {
    return 'Crea il tuo account'
  }

  return 'Accedi al fantaconcorso'
})

const subtitle = computed(() => {
  if (isRegistering.value) {
    return 'Registrati per creare la tua squadra di cantanti e scalare la classifica.'
  }

  return 'Rientra in gioco, gestisci la rosa e controlla i punteggi del contest.'
})

const handleAuth = async () => {
  error.value = ''

  if (isRegistering.value && password.value !== confirmPassword.value) {
    error.value = 'Le password non coincidono'
    return
  }

  try {
    if (isRegistering.value) {
      await authStore.register(username.value, password.value)
    } else {
      await authStore.login(username.value, password.value)
    }

    if (authStore.isAuthenticated) {
      router.push('/team')
    }
  } catch (err) {
    error.value = err.message
  }
}

const toggleMode = () => {
  isRegistering.value = !isRegistering.value
  error.value = ''
  username.value = ''
  password.value = ''
  confirmPassword.value = ''
}
</script>

<template>
  <div class="grid gap-8 py-6 lg:grid-cols-[0.9fr_1.1fr]">
    <section class="rounded-3xl bg-gray-900 p-8 text-white shadow-sm">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-200">
        Accesso giocatori
      </p>
      <h1 class="mt-3 text-4xl font-black tracking-tight">
        Entra in FantaRoncola e prepara la tua formazione.
      </h1>
      <p class="mt-4 text-base leading-7 text-gray-300">
        Il fantaconcorso dedicato ai cantanti dove contano intuito, budget e colpi di scena.
        Registrati o accedi per schierare i tuoi 5 artisti.
      </p>

      <div class="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        <div class="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          <div class="text-2xl font-black">100</div>
          <div class="mt-1 text-sm text-gray-300">crediti per costruire la squadra</div>
        </div>
        <div class="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          <div class="text-2xl font-black">5</div>
          <div class="mt-1 text-sm text-gray-300">cantanti da selezionare</div>
        </div>
        <div class="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          <div class="text-2xl font-black">1</div>
          <div class="mt-1 text-sm text-gray-300">classifica da conquistare</div>
        </div>
      </div>
    </section>

    <section class="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
      <div class="space-y-2">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          {{ isRegistering ? 'Registrazione' : 'Accesso' }}
        </p>
        <h2 class="text-3xl font-black tracking-tight text-gray-900">
          {{ title }}
        </h2>
        <p class="text-sm leading-6 text-gray-600">
          {{ subtitle }}
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleAuth">
        <div class="space-y-4">
          <div>
            <label for="username" class="mb-2 block text-sm font-medium text-gray-700">Username</label>
            <input
              id="username"
              v-model="username"
              name="username"
              type="text"
              required
              class="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="Scegli il tuo username"
            >
          </div>

          <div>
            <label for="password" class="mb-2 block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              required
              class="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="Inserisci la password"
            >
          </div>

          <div v-if="isRegistering">
            <label for="confirm-password" class="mb-2 block text-sm font-medium text-gray-700">
              Conferma password
            </label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              name="confirm-password"
              type="password"
              required
              class="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="Ripeti la password"
            >
          </div>
        </div>

        <div
          v-if="error"
          class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ error }}
        </div>

        <button
          type="submit"
          class="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          {{ isRegistering ? 'Crea account' : 'Accedi' }}
        </button>

        <div class="text-center text-sm text-gray-600">
          <button
            type="button"
            @click="toggleMode"
            class="font-semibold text-indigo-600 transition hover:text-indigo-500"
          >
            {{ isRegistering ? 'Hai gia un account? Accedi' : 'Non hai ancora un account? Registrati' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>
