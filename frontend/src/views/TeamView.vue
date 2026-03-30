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
    <div class="sticky top-4 z-10 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <div class="text-sm font-medium text-gray-500">Budget residuo</div>
            <div
              class="mt-1 text-3xl font-black"
              :class="store.currentBudget < 10 ? 'text-red-500' : 'text-green-600'"
            >
              {{ store.currentBudget }} / {{ store.maxBudget }}
            </div>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-500">Cantanti selezionati</div>
            <div class="mt-1 text-3xl font-black text-gray-900">{{ store.userTeam.length }} / 5</div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div
            v-if="authStore.user?.is_team_locked"
            class="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800"
          >
            Squadra bloccata
          </div>
          <button
            v-else
            @click="handleLockTeam"
            class="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Conferma squadra
          </button>
        </div>
      </div>
    </div>

    <section>
      <div class="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-gray-900">La tua squadra</h1>
          <p class="mt-1 text-sm text-gray-600">
            Scegli 5 cantanti e ottimizza il budget per restare competitivo.
          </p>
        </div>
      </div>

      <div
        v-if="store.userTeam.length === 0"
        class="rounded-2xl bg-white p-8 text-center italic text-gray-500 shadow-sm ring-1 ring-gray-200"
      >
        Non hai ancora scelto nessun cantante. Parti dalla lista qui sotto.
      </div>

      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div
          v-for="singer in store.userTeam"
          :key="singer.id"
          class="group relative rounded-2xl border-l-4 border-indigo-500 bg-white p-4 shadow-sm ring-1 ring-gray-200"
        >
          <button
            v-if="!authStore.user?.is_team_locked"
            @click="removeSinger(singer.id)"
            class="absolute right-3 top-3 text-sm font-medium text-red-500 opacity-0 transition group-hover:opacity-100"
          >
            Rimuovi
          </button>
          <div class="mb-3 flex items-center justify-center">
            <img
              :src="singer.image"
              :alt="singer.name"
              class="h-20 w-20 rounded-full border-2 border-indigo-500 object-cover"
            >
          </div>
          <div class="text-center text-lg font-bold text-gray-900">{{ singer.name }}</div>
          <div class="text-center text-sm text-gray-600">{{ singer.cost }} crediti</div>
        </div>
      </div>
    </section>

    <section v-if="!authStore.user?.is_team_locked">
      <div class="mb-4">
        <h2 class="text-2xl font-black tracking-tight text-gray-900">Cantanti disponibili</h2>
        <p class="mt-1 text-sm text-gray-600">
          Aggiungi gli artisti che preferisci finche hai slot e crediti a disposizione.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="singer in store.singers"
          :key="singer.id"
          class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md"
        >
          <div class="mb-3 flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <img
                :src="singer.image"
                :alt="singer.name"
                class="h-12 w-12 rounded-full object-cover"
              >
              <div>
                <div class="font-bold text-gray-900">{{ singer.name }}</div>
                <div class="text-xs text-gray-500">{{ singer.description }}</div>
              </div>
            </div>
            <span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
              {{ singer.cost }}
            </span>
          </div>

          <button
            @click="addSinger(singer)"
            :disabled="isSingerSelected(singer.id) || (store.isTeamFull && !isSingerSelected(singer.id)) || (store.currentBudget < singer.cost && !isSingerSelected(singer.id))"
            class="mt-2 w-full rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
            :class="isSingerSelected(singer.id)
              ? 'cursor-not-allowed bg-gray-100 text-gray-400'
              : ((store.isTeamFull || store.currentBudget < singer.cost)
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700')"
          >
            {{ isSingerSelected(singer.id) ? 'Selezionato' : 'Aggiungi alla squadra' }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

