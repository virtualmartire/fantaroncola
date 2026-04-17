<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../services/api'
import { useGameStore } from '../stores/game'
import { useAuthStore } from '../stores/auth'

const store = useGameStore()
const authStore = useAuthStore()
const {
  addSinger,
  removeSinger,
  fetchSingers,
  fetchTeam,
  lockTeam,
  persistDraftTeam,
  discardDraftChanges,
} = store
const allowLockedTeamEdits = ref(false)

const categorySections = computed(() => ([
  {
    key: 'adulti',
    title: 'Adulti/e',
    singers: store.singers.filter((singer) => singer.category === 'adulti'),
  },
  {
    key: 'bambini',
    title: 'Bambini/e',
    singers: store.singers.filter((singer) => singer.category === 'bambini'),
  },
]))

const teamStatusCards = computed(() => ([
  {
    key: 'adulti',
    title: 'Adulti/e scelti',
    value: `${store.selectedCounts.adulti || 0} / ${store.teamLimits.adulti}`,
  },
  {
    key: 'bambini',
    title: 'Bambini/e scelti',
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

const handleConfirmTeam = async () => {
  if (!store.isTeamComplete) return

  const alreadyLocked = authStore.user?.is_team_locked
  if (!alreadyLocked) {
    if (!confirm('Dopo aver confermato la squadra, potrai modificarla solo fino alla sera prima dell\'inizio della Roncola.')) {
      return
    }
  } else if (!confirm('Confermi la nuova composizione della squadra?')) {
    return
  }

  try {
    await persistDraftTeam()
    if (!alreadyLocked) {
      await lockTeam()
    }
    await authStore.fetchUser()
  } catch (error) {
    alert(error.message || 'Operazione non riuscita')
  }
}

const handleDiscardDraft = () => {
  if (!store.hasDraftChanges) return
  if (!confirm('Vuoi scartare le modifiche e tornare alla squadra salvata?')) {
    return
  }
  discardDraftChanges()
}

const isSingerSelected = (singerId) => store.draftTeam.some((singer) => singer.id === singerId)
const canSelectSinger = (singer) => store.canSelectSinger(singer)
const requiresTeamUpdate = computed(() => authStore.user?.is_team_locked && !store.isCommittedTeamComplete)
const isTeamEditingDisabled = computed(() => (
  authStore.user?.is_team_locked && !allowLockedTeamEdits.value && !requiresTeamUpdate.value
))
const canEditTeam = computed(() => (
  !authStore.user?.is_team_locked || allowLockedTeamEdits.value || requiresTeamUpdate.value
))

const displayedTeam = computed(() => (
  canEditTeam.value ? store.draftTeam : store.userTeam
))

const singerPhotoSrc = (singer) => {
  const url = singer?.image
  return typeof url === 'string' && url.trim() !== '' ? url.trim() : null
}

const singerInitial = (singer) => {
  const letter = (singer?.name?.trim() || '').charAt(0)
  return letter ? letter.toUpperCase() : '?'
}

const teamDescription = computed(() => {
  if (isTeamEditingDisabled.value) {
    return 'Squadra confermata. Ora puoi seguirne l\'andamento e tifare i tuoi cantanti in classifica.'
  }
  const base = authStore.user?.is_team_locked
    ? 'Squadra confermata, ma al momento puoi ancora modificarla.'
    : 'Scegli 2 adulti/e e 2 bambini/e per completare la tua squadra.'
  if (canEditTeam.value && store.hasDraftChanges) {
    return `${base} Le modifiche verranno salvate solo dopo la conferma.`
  }
  return base
})
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

        <div class="flex flex-wrap items-center gap-3">
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
          <template v-else>
            <div
              v-if="authStore.user?.is_team_locked"
              class="status-badge rounded-full px-4 py-2 text-sm font-semibold"
            >
              Modifiche ancora aperte
            </div>
            <button
              v-if="canEditTeam && !authStore.user?.is_team_locked"
              type="button"
              @click="handleConfirmTeam"
              :disabled="!store.isTeamComplete"
              class="gold-button rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Conferma squadra
            </button>
            <button
              v-if="canEditTeam && authStore.user?.is_team_locked && store.isTeamComplete && store.hasDraftChanges"
              type="button"
              @click="handleConfirmTeam"
              class="gold-button rounded-xl px-4 py-2 text-sm font-semibold transition"
            >
              Conferma modifiche
            </button>
            <button
              v-if="canEditTeam && store.hasDraftChanges"
              type="button"
              @click="handleDiscardDraft"
              class="ghost-button rounded-xl px-4 py-2 text-sm font-semibold transition"
            >
              Annulla modifiche
            </button>
          </template>
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
        </div>
      </div>

      <div
        v-if="displayedTeam.length === 0"
        class="empty-card rounded-2xl p-8 text-center italic"
      >
        Non hai ancora scelto nessun cantante. Parti dalla lista qui sotto.
      </div>

      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="singer in displayedTeam"
          :key="singer.id"
          class="surface-card relative rounded-2xl border-l-4 border-[#d4af37] p-4"
        >
          <div class="relative">
            <button
              v-if="canEditTeam"
              type="button"
              @click="removeSinger(singer.id)"
              class="ghost-button absolute right-0 top-0 z-[2] rounded-lg px-3 py-1.5 text-xs font-semibold transition"
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
              {{ singer.category === 'bambini' ? 'Bambini/e' : 'Adulti/e' }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="canEditTeam">
      <div class="mb-4">
        <h2 class="text-2xl font-black tracking-tight text-[#fff0cf]">Cantanti disponibili</h2>
        <p class="gold-copy mt-1 text-sm">
          Scegli liberamente, ma la squadra deve avere esattamente 2 adulti/e e 2 bambini/e.
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
                type="button"
                @click="addSinger(singer)"
                :disabled="isSingerSelected(singer.id) || !canSelectSinger(singer)"
                class="mt-2 w-full rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                :class="isSingerSelected(singer.id) || !canSelectSinger(singer)
                  ? 'cursor-not-allowed border border-[rgba(224,191,115,0.12)] bg-[rgba(255,255,255,0.03)] text-[#6f6042]'
                  : 'gold-button'"
              >
                {{ isSingerSelected(singer.id) ? 'Selezionato' : 'Aggiungi' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
