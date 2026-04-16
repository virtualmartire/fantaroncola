<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../services/api'
import { useGameStore } from '../stores/game'
import { useAuthStore } from '../stores/auth'

const store = useGameStore()
const authStore = useAuthStore()
const { addSinger, removeSinger, fetchSingers, fetchTeam, lockTeam } = store
const allowLockedTeamEdits = ref(false)

const categorySections = computed(() => ([
  {
    key: 'adulti',
    title: 'Adulti',
    singers: store.singers.filter((singer) => singer.category === 'adulti'),
  },
  {
    key: 'bambini',
    title: 'Bambini',
    singers: store.singers.filter((singer) => singer.category === 'bambini'),
  },
]))

const teamStatusCards = computed(() => ([
  {
    key: 'adulti',
    title: 'Adulti scelti',
    value: `${store.selectedCounts.adulti || 0} / ${store.teamLimits.adulti}`,
  },
  {
    key: 'bambini',
    title: 'Bambini scelti',
    value: `${store.selectedCounts.bambini || 0} / ${store.teamLimits.bambini}`,
  },
]))

onMounted(() => {
  fetchSingers()
  fetchTeam()
  fetchTeamSettings()
})

const fetchTeamSettings = async () => {
  try {
    const data = await api.get('/team/settings')
    allowLockedTeamEdits.value = Boolean(data?.allow_locked_team_edits)
  } catch (error) {
    console.error('Errore nel caricamento delle impostazioni squadra:', error)
    allowLockedTeamEdits.value = false
  }
}

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
const canSelectSinger = (singer) => store.canSelectSinger(singer)
const requiresTeamUpdate = computed(() => authStore.user?.is_team_locked && !store.isTeamComplete)
const isTeamEditingDisabled = computed(() => (
  authStore.user?.is_team_locked && !allowLockedTeamEdits.value && !requiresTeamUpdate.value
))
const canEditTeam = computed(() => (
  !authStore.user?.is_team_locked || allowLockedTeamEdits.value || requiresTeamUpdate.value
))

const singerPhotoSrc = (singer) => {
  const url = singer?.image
  return typeof url === 'string' && url.trim() !== '' ? url.trim() : null
}

const singerInitial = (singer) => {
  const letter = (singer?.name?.trim() || '').charAt(0)
  return letter ? letter.toUpperCase() : '?'
}

const teamDescription = computed(() => (
  requiresTeamUpdate.value
    ? 'La tua squadra era stata confermata con le vecchie regole: aggiornala a 2 adulti e 2 bambini.'
    : isTeamEditingDisabled.value
    ? 'Squadra confermata. Ora puoi seguirne l\'andamento e tifare i tuoi cantanti in classifica.'
    : authStore.user?.is_team_locked
      ? 'Squadra confermata, ma al momento puoi ancora modificarla.'
    : 'Scegli 2 adulti e 2 bambini per completare la tua squadra.'
))
</script>

<template>
  <div class="space-y-8">
    <div class="surface-card sticky top-4 z-10 rounded-2xl p-4">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="grid gap-4 sm:grid-cols-2">
          <div
            v-for="item in teamStatusCards"
            :key="item.key"
          >
            <div class="gold-muted text-sm font-medium">{{ item.title }}</div>
            <div class="mt-1 text-3xl font-black text-[#ffe09a]">
              {{ item.value }}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div
            v-if="requiresTeamUpdate"
            class="status-badge rounded-full px-4 py-2 text-sm font-semibold"
          >
            Aggiornamento richiesto
          </div>
          <div
            v-else-if="isTeamEditingDisabled"
            class="status-badge rounded-full px-4 py-2 text-sm font-semibold"
          >
            Squadra bloccata
          </div>
          <div
            v-else-if="authStore.user?.is_team_locked"
            class="status-badge rounded-full px-4 py-2 text-sm font-semibold"
          >
            Modifiche ancora aperte
          </div>
          <button
            v-else
            @click="handleLockTeam"
            :disabled="!store.isTeamComplete"
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
            {{ teamDescription }}
          </p>
          <p class="gold-muted mt-2 text-sm">
            La squadra è valida solo quando contiene esattamente 2 adulti e 2 bambini.
          </p>
        </div>
      </div>

      <div
        v-if="store.userTeam.length === 0"
        class="empty-card rounded-2xl p-8 text-center italic"
      >
        Non hai ancora scelto nessun cantante. Parti dalla lista qui sotto.
      </div>

      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="singer in store.userTeam"
          :key="singer.id"
          class="surface-card group relative rounded-2xl border-l-4 border-[#d4af37] p-4"
        >
          <button
            v-if="canEditTeam"
            @click="removeSinger(singer.id)"
            class="absolute right-3 top-3 text-sm font-medium text-[#f2a8a3] opacity-0 transition group-hover:opacity-100"
          >
            Rimuovi
          </button>
          <div class="mb-3 flex items-center justify-center">
            <img
              v-if="singerPhotoSrc(singer)"
              :src="singerPhotoSrc(singer)"
              :alt="singer.name"
              class="h-20 w-20 rounded-full border-2 border-[#d4af37] object-cover"
            >
            <div
              v-else
              class="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#d4af37] bg-[rgba(255,255,255,0.06)] text-lg font-bold text-[#c9ab67]"
              aria-hidden="true"
            >
              {{ singerInitial(singer) }}
            </div>
          </div>
          <div class="text-center text-lg font-bold text-[#fff0cf]">{{ singer.name }}</div>
          <div class="mt-1 text-center text-sm font-semibold text-[#ffe09a]">{{ singer.song_title }}</div>
          <div
            v-if="singer.description"
            class="gold-muted mx-auto mt-2 max-w-xs text-center text-xs leading-5"
          >
            {{ singer.description }}
          </div>
          <div class="gold-pill mx-auto mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold">
            {{ singer.category === 'bambini' ? 'Bambini' : 'Adulti' }}
          </div>
        </div>
      </div>
    </section>

    <section v-if="canEditTeam">
      <div class="mb-4">
        <h2 class="text-2xl font-black tracking-tight text-[#fff0cf]">Cantanti disponibili</h2>
        <p class="gold-copy mt-1 text-sm">
          Scegli liberamente, ma la squadra deve avere esattamente 2 adulti e 2 bambini.
        </p>
      </div>

      <div class="space-y-6">
        <div
          v-for="section in categorySections"
          :key="section.key"
          class="space-y-4"
        >
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-xl font-bold text-[#fff0cf]">{{ section.title }}</h3>
            <div class="gold-pill rounded-full px-3 py-1 text-xs font-semibold">
              {{ store.selectedCounts[section.key] || 0 }} / {{ store.teamLimits[section.key] }}
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div
              v-for="singer in section.singers"
              :key="singer.id"
              class="surface-card rounded-2xl p-4 transition hover:-translate-y-0.5"
            >
              <div class="mb-3 flex items-start gap-3">
                <img
                  v-if="singerPhotoSrc(singer)"
                  :src="singerPhotoSrc(singer)"
                  :alt="singer.name"
                  class="h-12 w-12 shrink-0 rounded-full object-cover"
                >
                <div
                  v-else
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[rgba(212,175,55,0.45)] bg-[rgba(255,255,255,0.06)] text-sm font-bold text-[#c9ab67]"
                  aria-hidden="true"
                >
                  {{ singerInitial(singer) }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-[#fff0cf]">{{ singer.name }}</div>
                  <div class="text-xs font-semibold text-[#ffe09a]">{{ singer.song_title }}</div>
                  <div
                    v-if="singer.description"
                    class="gold-muted mt-2 text-xs leading-5"
                  >
                    {{ singer.description }}
                  </div>
                </div>
              </div>

              <button
                @click="addSinger(singer)"
                :disabled="isSingerSelected(singer.id) || !canSelectSinger(singer)"
                class="mt-2 w-full rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                :class="isSingerSelected(singer.id) || !canSelectSinger(singer)
                  ? 'cursor-not-allowed border border-[rgba(224,191,115,0.12)] bg-[rgba(255,255,255,0.03)] text-[#6f6042]'
                  : 'gold-button'"
              >
                {{ isSingerSelected(singer.id) ? 'Selezionato' : `Aggiungi tra gli ${section.title.toLowerCase()}` }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

