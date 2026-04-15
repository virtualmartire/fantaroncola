<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const captchaEndpoint = `${import.meta.env.VITE_API_BASE || '/api'}/auth/captcha`

const isRegistering = ref(false)
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const captchaAnswer = ref('')
const captchaSvg = ref('')
const isCaptchaLoading = ref(false)
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

  if (isRegistering.value && !captchaAnswer.value.trim()) {
    error.value = 'Inserisci il captcha per completare la registrazione'
    return
  }

  try {
    if (isRegistering.value) {
      await authStore.register(username.value, password.value, captchaAnswer.value)
    } else {
      await authStore.login(username.value, password.value)
    }

    if (authStore.isAuthenticated) {
      router.push('/team')
    }
  } catch (err) {
    error.value = err.message

    if (isRegistering.value) {
      captchaAnswer.value = ''

      try {
        await refreshCaptcha()
      } catch {
        // Keep the original signup error visible if captcha refresh fails.
      }
    }
  }
}

const refreshCaptcha = async () => {
  if (!isRegistering.value) {
    return
  }

  isCaptchaLoading.value = true

  try {
    const response = await fetch(`${captchaEndpoint}?ts=${Date.now()}`, {
      cache: 'no-store',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Impossibile caricare il captcha. Riprova.')
    }

    captchaSvg.value = await response.text()
  } catch (err) {
    captchaSvg.value = ''
    throw new Error(err.message || 'Impossibile caricare il captcha. Riprova.')
  } finally {
    isCaptchaLoading.value = false
  }
}

const toggleMode = async () => {
  isRegistering.value = !isRegistering.value
  error.value = ''
  username.value = ''
  password.value = ''
  confirmPassword.value = ''
  captchaAnswer.value = ''
  captchaSvg.value = ''

  if (isRegistering.value) {
    try {
      await refreshCaptcha()
    } catch (err) {
      error.value = err.message
    }
  }
}
</script>

<template>
  <div class="grid gap-8 py-6 lg:grid-cols-[0.9fr_1.1fr]">
    <section class="hero-surface rounded-3xl p-8">
      <p class="gold-kicker text-sm font-semibold uppercase">
        Accesso giocatori
      </p>
      <h1 class="mt-3 text-4xl font-black tracking-tight text-[#fff3db]">
        Entra in FantaRoncola e prepara la tua formazione.
      </h1>
      <p class="gold-copy mt-4 text-base leading-7">
        Il fantaconcorso dedicato ai cantanti dove contano intuito, categorie e colpi di scena.
        Registrati o accedi per schierare 2 adulti e 2 bambini.
      </p>

      <div class="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        <div class="gold-stat rounded-2xl px-5 py-4">
          <div class="text-2xl font-black text-[#ffe9b0]">2</div>
          <div class="gold-copy mt-1 text-sm">adulti da selezionare</div>
        </div>
        <div class="gold-stat rounded-2xl px-5 py-4">
          <div class="text-2xl font-black text-[#ffe9b0]">2</div>
          <div class="gold-copy mt-1 text-sm">bambini da selezionare</div>
        </div>
        <div class="gold-stat rounded-2xl px-5 py-4">
          <div class="text-2xl font-black text-[#ffe9b0]">1</div>
          <div class="gold-copy mt-1 text-sm">classifica da conquistare</div>
        </div>
      </div>
    </section>

    <section class="surface-card rounded-3xl p-8">
      <div class="space-y-2">
        <p class="gold-kicker text-sm font-semibold uppercase">
          {{ isRegistering ? 'Registrazione' : 'Accesso' }}
        </p>
        <h2 class="text-3xl font-black tracking-tight text-[#fff0cf]">
          {{ title }}
        </h2>
        <p class="gold-copy text-sm leading-6">
          {{ subtitle }}
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleAuth">
        <div class="space-y-4">
          <div>
            <label for="username" class="field-label mb-2 block text-sm font-medium">Username</label>
            <input
              id="username"
              v-model="username"
              name="username"
              type="text"
              required
              class="field-input block px-4 py-3 shadow-sm transition"
              placeholder="Scegli il tuo username"
            >
          </div>

          <div>
            <label for="password" class="field-label mb-2 block text-sm font-medium">Password</label>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              required
              class="field-input block px-4 py-3 shadow-sm transition"
              placeholder="Inserisci la password"
            >
          </div>

          <div v-if="isRegistering">
            <label for="confirm-password" class="field-label mb-2 block text-sm font-medium">
              Conferma password
            </label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              name="confirm-password"
              type="password"
              required
              class="field-input block px-4 py-3 shadow-sm transition"
              placeholder="Ripeti la password"
            >
          </div>

          <div v-if="isRegistering" class="space-y-3">
            <div class="flex items-center justify-between gap-3">
              <label class="field-label block text-sm font-medium">Captcha</label>
              <button
                type="button"
                @click="refreshCaptcha"
                :disabled="isCaptchaLoading"
                class="ghost-button rounded-xl px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ isCaptchaLoading ? 'Aggiornamento...' : 'Rigenera captcha' }}
              </button>
            </div>

            <div
              class="min-h-[88px] rounded-2xl border border-[rgba(224,191,115,0.16)] bg-[rgba(255,248,227,0.96)] p-3 shadow-inner"
            >
              <div
                v-if="captchaSvg"
                class="flex min-h-[64px] items-center justify-center overflow-hidden rounded-xl"
                v-html="captchaSvg"
              />
              <div
                v-else
                class="flex min-h-[64px] items-center justify-center text-sm text-[#6f6042]"
              >
                {{ isCaptchaLoading ? 'Caricamento captcha...' : 'Captcha non disponibile' }}
              </div>
            </div>

            <div>
              <label for="captcha" class="field-label mb-2 block text-sm font-medium">
                Inserisci i caratteri mostrati
              </label>
              <input
                id="captcha"
                v-model="captchaAnswer"
                name="captcha"
                type="text"
                required
                class="field-input block px-4 py-3 shadow-sm transition"
                placeholder="Scrivi qui il captcha"
              >
            </div>
          </div>
        </div>

        <div
          v-if="error"
          class="error-card rounded-2xl px-4 py-3 text-sm"
        >
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="isRegistering && isCaptchaLoading"
          class="gold-button w-full rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ isRegistering ? 'Crea account' : 'Accedi' }}
        </button>

        <div class="gold-copy text-center text-sm">
          <button
            type="button"
            @click="toggleMode"
            class="text-button font-semibold transition"
          >
            {{ isRegistering ? 'Hai gia un account? Accedi' : 'Non hai ancora un account? Registrati' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>
