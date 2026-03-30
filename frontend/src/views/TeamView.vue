<script setup>
import { onMounted } from 'vue'
import { useGameStore } from '../stores/game'
import { useAuthStore } from '../stores/auth'

const store = useGameStore()
const authStore = useAuthStore()
const { addSinger, removeSinger, fetchSingers, fetchTeam, lockTeam } = store

onMounted(() => {
  fetchSingers()
  fetchTeam()
})

const handleLockTeam = async () => {
  if (!confirm('Vuoi davvero bloccare la squadra? Dopo non potrai piu modificarla.')) {
    return
  }

  try {
    await lockTeam()
    authStore.fetchUser()
  } catch (error) {
    alert(error.message || 'Impossibile bloccare la squadra')
  }
}

const isSingerSelected = (singerId) => store.userTeam.some((singer) => singer.id === singerId)
</script>

<template>
  <div class="space-y-8">
    <div class="surface-card sticky top-4 z-10 rounded-2xl p-4">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <div class="gold-muted text-sm font-medium">Budget residuo</div>
            <div
              class="mt-1 text-3xl font-black"
              :class="store.currentBudget < 10 ? 'text-[#f2a8a3]' : 'text-[#ffe09a]'"
            >
              {{ store.currentBudget }} / {{ store.maxBudget }}
            </div>
          </div>
          <div>
            <div class="gold-muted text-sm font-medium">Cantanti selezionati</div>
            <div class="mt-1 text-3xl font-black text-[#fff0cf]">{{ store.userTeam.length }} / 5</div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div
            v-if="authStore.user?.is_team_locked"
            class="status-badge rounded-full px-4 py-2 text-sm font-semibold"
          >
            Squadra bloccata
          </div>
          <button
            v-else
            @click="handleLockTeam"
            class="gold-button rounded-xl px-4 py-2 text-sm font-semibold transition"
          >
            Conferma squadra
          </button>
        </div>
      </div>
    </div>

    <section>
      <div class="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-[#fff0cf]">La tua squadra</h1>
          <p class="gold-copy mt-1 text-sm">
            Scegli 5 cantanti e ottimizza il budget per restare competitivo.
          </p>
        </div>
      </div>

      <div
        v-if="store.userTeam.length === 0"
        class="empty-card rounded-2xl p-8 text-center italic"
      >
        Non hai ancora scelto nessun cantante. Parti dalla lista qui sotto.
      </div>

      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div
          v-for="singer in store.userTeam"
          :key="singer.id"
          class="surface-card group relative rounded-2xl border-l-4 border-[#d4af37] p-4"
        >
          <button
            v-if="!authStore.user?.is_team_locked"
            @click="removeSinger(singer.id)"
            class="absolute right-3 top-3 text-sm font-medium text-[#f2a8a3] opacity-0 transition group-hover:opacity-100"
          >
            Rimuovi
          </button>
          <div class="mb-3 flex items-center justify-center">
            <img
              :src="singer.image"
              :alt="singer.name"
              class="h-20 w-20 rounded-full border-2 border-[#d4af37] object-cover"
            >
          </div>
          <div class="text-center text-lg font-bold text-[#fff0cf]">{{ singer.name }}</div>
          <div class="gold-copy text-center text-sm">{{ singer.cost }} crediti</div>
        </div>
      </div>
    </section>

    <section v-if="!authStore.user?.is_team_locked">
      <div class="mb-4">
        <h2 class="text-2xl font-black tracking-tight text-[#fff0cf]">Cantanti disponibili</h2>
        <p class="gold-copy mt-1 text-sm">
          Aggiungi gli artisti che preferisci finche hai slot e crediti a disposizione.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="singer in store.singers"
          :key="singer.id"
          class="surface-card rounded-2xl p-4 transition hover:-translate-y-0.5"
        >
          <div class="mb-3 flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <img
                :src="singer.image"
                :alt="singer.name"
                class="h-12 w-12 rounded-full object-cover"
              >
              <div>
                <div class="font-bold text-[#fff0cf]">{{ singer.name }}</div>
                <div class="gold-muted text-xs">{{ singer.description }}</div>
              </div>
            </div>
            <span class="gold-pill rounded-full px-2.5 py-1 text-xs font-semibold">
              {{ singer.cost }}
            </span>
          </div>

          <button
            @click="addSinger(singer)"
            :disabled="isSingerSelected(singer.id) || (store.isTeamFull && !isSingerSelected(singer.id)) || (store.currentBudget < singer.cost && !isSingerSelected(singer.id))"
            class="mt-2 w-full rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
            :class="isSingerSelected(singer.id)
              ? 'cursor-not-allowed border border-[rgba(224,191,115,0.12)] bg-[rgba(255,255,255,0.03)] text-[#6f6042]'
              : ((store.isTeamFull || store.currentBudget < singer.cost)
                  ? 'cursor-not-allowed border border-[rgba(224,191,115,0.12)] bg-[rgba(255,255,255,0.03)] text-[#6f6042]'
                  : 'gold-button')"
          >
            {{ isSingerSelected(singer.id) ? 'Selezionato' : 'Aggiungi alla squadra' }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

