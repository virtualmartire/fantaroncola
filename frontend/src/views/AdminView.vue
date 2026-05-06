<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../services/api'

const allowLockedTeamEdits = ref(false)
const allowNewUserSignups = ref(true)
const isSettingsLoading = ref(true)
const isTeamSettingsSaving = ref(false)
const isSignupSettingsSaving = ref(false)
const isStatsLoading = ref(true)
const hasStatsError = ref(false)
const isUsersLoading = ref(true)
const hasUsersError = ref(false)
const registeredUsers = ref([])
const allSingers = ref([])
const singerSearch = ref('')
const adminStats = ref({
  registeredUsers: 0,
  confirmedTeams: 0,
})
const expectedTeamSize = 4

const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()

const singerPhotoSrc = (singer) => {
  const url = singer?.image
  return typeof url === 'string' && url.trim() !== '' ? url.trim() : null
}

const singerInitial = (singer) => {
  const letter = (singer?.name?.trim() || '').charAt(0)
  return letter ? letter.toUpperCase() : '?'
}

const categoryLabel = (category) => (
  category === 'bambini' ? 'Bambini/e' : 'Adulti/e'
)

const teamCompositionLabel = (user) => {
  if (!Array.isArray(user?.team) || user.team.length === 0) {
    return 'Nessun cantante selezionato.'
  }

  const counts = user.team.reduce((accumulator, singer) => {
    const category = singer?.category === 'bambini' ? 'bambini' : 'adulti'
    accumulator[category] += 1
    return accumulator
  }, { adulti: 0, bambini: 0 })

  return `${user.team.length} cantanti scelti (${counts.adulti} adulti/e, ${counts.bambini} bambini/e)`
}

const statsCards = computed(() => ([
  {
    key: 'registered-users',
    title: 'Utenti registrati',
    value: isStatsLoading.value
      ? 'Caricamento...'
      : hasStatsError.value
        ? 'N/D'
        : adminStats.value.registeredUsers,
  },
  {
    key: 'confirmed-teams',
    title: 'Squadre confermate',
    value: isStatsLoading.value
      ? 'Caricamento...'
      : hasStatsError.value
        ? 'N/D'
        : adminStats.value.confirmedTeams,
  },
]))

const isAnySettingsSaving = computed(() => (
  isTeamSettingsSaving.value || isSignupSettingsSaving.value
))

const hasSingerSearch = computed(() => singerSearch.value.trim() !== '')
const normalizedSingerSearch = computed(() => normalizeText(singerSearch.value))

const availableSingerOptions = computed(() => {
  if (allSingers.value.length > 0) {
    return allSingers.value
  }

  const singerMap = new Map()

  for (const user of registeredUsers.value) {
    for (const singer of user.team || []) {
      if (!singerMap.has(singer.id)) {
        singerMap.set(singer.id, singer)
      }
    }
  }

  return Array.from(singerMap.values())
    .sort((left, right) => left.name.localeCompare(right.name, 'it'))
})

const matchingSingers = computed(() => {
  if (!hasSingerSearch.value) {
    return []
  }

  const query = normalizedSingerSearch.value

  return availableSingerOptions.value
    .filter((singer) => normalizeText(singer.name).includes(query))
    .slice(0, 8)
})

const filteredUsers = computed(() => {
  if (!hasSingerSearch.value) {
    return registeredUsers.value
  }

  const query = normalizedSingerSearch.value

  return registeredUsers.value.filter((user) => (
    user.team.some((singer) => normalizeText(singer.name).includes(query))
  ))
})

const usersFilterSummary = computed(() => {
  if (isUsersLoading.value) {
    return 'Caricamento utenti...'
  }

  const totalUsers = registeredUsers.value.length
  if (!hasSingerSearch.value) {
    return totalUsers === 1 ? '1 utente registrato' : `${totalUsers} utenti registrati`
  }

  const visibleUsers = filteredUsers.value.length
  const noun = visibleUsers === 1 ? 'utente' : 'utenti'
  const verb = visibleUsers === 1 ? 'corrisponde' : 'corrispondono'

  return `${visibleUsers} ${noun} su ${totalUsers} ${verb} al filtro`
})

const fetchAdminSettings = async () => {
  isSettingsLoading.value = true

  try {
    const data = await api.get('/team/settings')
    allowLockedTeamEdits.value = Boolean(data?.allow_locked_team_edits ?? true)
    allowNewUserSignups.value = Boolean(data?.allow_new_user_signups ?? true)
  } catch (error) {
    console.error('Errore nel caricamento delle impostazioni admin:', error)
  } finally {
    isSettingsLoading.value = false
  }
}

const fetchAdminStats = async () => {
  isStatsLoading.value = true
  hasStatsError.value = false

  try {
    const data = await api.get('/team/admin/stats')
    adminStats.value = {
      registeredUsers: Number(data?.registered_users ?? 0),
      confirmedTeams: Number(data?.confirmed_teams ?? 0),
    }
  } catch (error) {
    console.error('Errore nel caricamento delle statistiche admin:', error)
    hasStatsError.value = true
  } finally {
    isStatsLoading.value = false
  }
}

const fetchRegisteredUsers = async () => {
  isUsersLoading.value = true
  hasUsersError.value = false

  try {
    const data = await api.get('/team/admin/users')
    registeredUsers.value = Array.isArray(data)
      ? data.map((user) => ({
          ...user,
          team: Array.isArray(user?.team) ? user.team : [],
        }))
      : []
  } catch (error) {
    console.error('Errore nel caricamento degli utenti admin:', error)
    hasUsersError.value = true
    registeredUsers.value = []
  } finally {
    isUsersLoading.value = false
  }
}

const fetchSingers = async () => {
  try {
    const data = await api.get('/singers')
    allSingers.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Errore nel caricamento dei cantanti admin:', error)
    allSingers.value = []
  }
}

const updateAdminSettings = async (payload) => {
  const data = await api.request('/team/settings', 'PUT', payload)
  allowLockedTeamEdits.value = Boolean(data?.allow_locked_team_edits ?? true)
  allowNewUserSignups.value = Boolean(data?.allow_new_user_signups ?? true)
}

const toggleLockedTeamEditability = async () => {
  const willAllow = !allowLockedTeamEdits.value
  const message = willAllow
    ? 'Vuoi consentire agli utenti di modificare le squadre confermate?'
    : 'Vuoi impedire le modifiche alle squadre confermate?'

  if (!confirm(message)) {
    return
  }

  isTeamSettingsSaving.value = true

  try {
    await updateAdminSettings({
      allowLockedTeamEdits: willAllow,
    })
  } catch (error) {
    alert(error.message)
  } finally {
    isTeamSettingsSaving.value = false
  }
}

const toggleNewUserSignups = async () => {
  const willAllow = !allowNewUserSignups.value
  const message = willAllow
    ? 'Vuoi riaprire le iscrizioni ai nuovi utenti?'
    : 'Vuoi bloccare le iscrizioni ai nuovi utenti?'

  if (!confirm(message)) {
    return
  }

  isSignupSettingsSaving.value = true

  try {
    await updateAdminSettings({
      allowNewUserSignups: willAllow,
    })
  } catch (error) {
    alert(error.message)
  } finally {
    isSignupSettingsSaving.value = false
  }
}

const teamStatusLabel = computed(() => (
  allowLockedTeamEdits.value ? 'Modifiche abilitate' : 'Modifiche bloccate'
))

const teamStatusDescription = computed(() => (
  allowLockedTeamEdits.value
    ? 'Gli utenti possono ancora modificare le squadre confermate.'
    : 'Le squadre confermate dagli utenti non sono più modificabili.'
))

const teamButtonLabel = computed(() => {
  if (isSettingsLoading.value) {
    return 'Caricamento...'
  }

  if (isTeamSettingsSaving.value) {
    return 'Salvataggio...'
  }

  return allowLockedTeamEdits.value
    ? 'Blocca le squadre confermate'
    : 'Rendi modificabili le squadre confermate'
})

const signupStatusLabel = computed(() => (
  allowNewUserSignups.value ? 'Iscrizioni aperte' : 'Iscrizioni bloccate'
))

const signupStatusDescription = computed(() => (
  allowNewUserSignups.value
    ? 'I nuovi utenti possono creare un account e partecipare al fantaconcorso.'
    : 'Le nuove registrazioni sono disabilitate. Gli utenti esistenti possono comunque accedere.'
))

const signupButtonLabel = computed(() => {
  if (isSettingsLoading.value) {
    return 'Caricamento...'
  }

  if (isSignupSettingsSaving.value) {
    return 'Salvataggio...'
  }

  return allowNewUserSignups.value
    ? 'Blocca nuove iscrizioni'
    : 'Riapri nuove iscrizioni'
})

const applySingerFilter = (singerName) => {
  singerSearch.value = singerName
}

const clearSingerSearch = () => {
  singerSearch.value = ''
}

const isSingerMatchingSearch = (singer) => {
  if (!hasSingerSearch.value) {
    return false
  }

  return normalizeText(singer?.name).includes(normalizedSingerSearch.value)
}

onMounted(() => {
  fetchAdminSettings()
  fetchAdminStats()
  fetchRegisteredUsers()
  fetchSingers()
})
</script>

<template>
  <div class="space-y-8">
    <div>
      <p class="gold-kicker text-sm font-semibold uppercase">Backstage</p>
      <h1 class="mt-2 text-3xl font-black tracking-tight text-[#fff0cf]">Pannello admin</h1>
    </div>

    <div class="surface-card rounded-2xl p-6 sm:p-8">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div class="max-w-2xl">
          <p class="gold-kicker text-sm font-semibold uppercase">Panoramica</p>
          <h2 class="mt-2 text-2xl font-black tracking-tight text-[#fff0cf]">
            Statistiche iscrizioni
          </h2>
          <p class="gold-copy mt-3 text-sm leading-6">
            Indicatori di monitoraggio della piattaforma.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:min-w-[26rem]">
          <div
            v-for="item in statsCards"
            :key="item.key"
            class="rounded-2xl border border-[rgba(224,191,115,0.14)] bg-[rgba(12,10,9,0.38)] p-5"
          >
            <div class="gold-muted text-sm font-medium">{{ item.title }}</div>
            <div class="mt-2 text-3xl font-black text-[#ffe09a]">
              {{ item.value }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="surface-card rounded-2xl p-6 sm:p-8">
      <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-2xl">
          <p class="gold-kicker text-sm font-semibold uppercase">Utenti</p>
          <h2 class="mt-2 text-2xl font-black tracking-tight text-[#fff0cf]">
            Squadre registrate
          </h2>
          <p class="gold-copy mt-3 text-sm leading-6">
            Consulta tutti gli utenti iscritti e verifica quali cantanti hanno scelto nelle loro squadre.
          </p>
        </div>

        <div class="w-full max-w-xl">
          <label for="admin-singer-search" class="field-label mb-2 block text-sm font-medium">
            Filtra per cantante
          </label>
          <input
            id="admin-singer-search"
            v-model="singerSearch"
            type="text"
            class="field-input block px-4 py-3 shadow-sm transition"
            placeholder="Scrivi il nome di un cantante"
            autocomplete="off"
            autocapitalize="none"
            autocorrect="off"
            spellcheck="false"
          >

          <div class="mt-3 flex items-center justify-between gap-3">
            <p class="gold-muted text-xs sm:text-sm">
              {{
                hasSingerSearch
                  ? 'Seleziona un cantante suggerito o continua a scrivere per filtrare i risultati.'
                  : 'Inizia a digitare per vedere i cantanti disponibili.'
              }}
            </p>
            <button
              v-if="hasSingerSearch"
              type="button"
              @click="clearSingerSearch"
              class="ghost-button shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition"
            >
              Azzera filtro
            </button>
          </div>

          <div
            v-if="hasSingerSearch"
            class="mt-3 rounded-2xl border border-[rgba(224,191,115,0.12)] bg-[rgba(12,10,9,0.38)] p-2"
          >
            <div v-if="matchingSingers.length > 0" class="max-h-56 space-y-1 overflow-y-auto">
              <button
                v-for="singer in matchingSingers"
                :key="`search-singer-${singer.id}`"
                type="button"
                @click="applySingerFilter(singer.name)"
                class="w-full rounded-xl px-3 py-2 text-left transition hover:bg-[rgba(224,191,115,0.08)]"
              >
                <div class="font-semibold text-[#fff0cf]">{{ singer.name }}</div>
                <div v-if="singer.song_title" class="gold-muted text-xs">
                  {{ singer.song_title }}
                </div>
              </button>
            </div>
            <p v-else class="gold-copy px-3 py-2 text-sm">
              Nessun cantante trovato.
            </p>
          </div>
        </div>
      </div>

      <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p class="gold-muted text-sm">{{ usersFilterSummary }}</p>
        <p v-if="hasSingerSearch" class="text-sm font-semibold text-[#ffe09a]">
          Filtro attivo: {{ singerSearch }}
        </p>
      </div>

      <div
        v-if="isUsersLoading"
        class="empty-card mt-6 rounded-2xl p-6 text-center italic"
      >
        Caricamento utenti registrati...
      </div>

      <div
        v-else-if="hasUsersError"
        class="error-card mt-6 rounded-2xl p-6 text-sm"
      >
        Impossibile caricare l'elenco degli utenti registrati.
      </div>

      <div
        v-else-if="filteredUsers.length === 0"
        class="empty-card mt-6 rounded-2xl p-6 text-center italic"
      >
        {{
          hasSingerSearch
            ? 'Nessun utente ha scelto il cantante cercato.'
            : 'Non ci sono ancora utenti registrati.'
        }}
      </div>

      <div v-else class="mt-6 grid gap-4 xl:grid-cols-2">
        <article
          v-for="user in filteredUsers"
          :key="user.id"
          class="rounded-2xl border border-[rgba(224,191,115,0.14)] bg-[rgba(12,10,9,0.34)] p-5"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 class="text-xl font-black tracking-tight text-[#fff0cf]">{{ user.username }}</h3>
            </div>

          </div>

          <div
            v-if="user.team.length === 0"
            class="empty-card mt-4 rounded-2xl p-4 text-center text-sm italic"
          >
            Nessun cantante selezionato.
          </div>

          <div v-else class="mt-4 grid gap-3 sm:grid-cols-2">
            <div
              v-for="singer in user.team"
              :key="`${user.id}-${singer.id}`"
              class="rounded-2xl border p-3 transition"
              :class="isSingerMatchingSearch(singer)
                ? 'border-[#d4af37] bg-[rgba(212,175,55,0.14)]'
                : 'border-[rgba(224,191,115,0.12)] bg-[rgba(255,255,255,0.03)]'"
            >
              <div class="flex items-start gap-3">
                <img
                  v-if="singerPhotoSrc(singer)"
                  :src="singerPhotoSrc(singer)"
                  :alt="singer.name"
                  class="h-12 w-12 shrink-0 rounded-full border border-[rgba(212,175,55,0.45)] object-cover"
                >
                <div
                  v-else
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[rgba(212,175,55,0.45)] bg-[rgba(255,255,255,0.06)] text-sm font-bold text-[#c9ab67]"
                  aria-hidden="true"
                >
                  {{ singerInitial(singer) }}
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-3">
                    <div class="font-bold text-[#fff0cf]">{{ singer.name }}</div>
                    <div
                      v-if="isSingerMatchingSearch(singer)"
                      class="gold-pill rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    >
                      Match
                    </div>
                  </div>
                  <div class="text-xs font-semibold text-[#ffe09a]">{{ singer.song_title }}</div>
                  <div
                    v-if="singer.description"
                    class="gold-muted mt-2 text-xs leading-5"
                  >
                    {{ singer.description }}
                  </div>
                  <div class="gold-pill mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold">
                    {{ categoryLabel(singer.category) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>

    <div class="surface-card rounded-2xl p-6 sm:p-8">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="max-w-2xl">
          <div class="status-badge inline-flex rounded-full px-4 py-2 text-sm font-semibold">
            {{ teamStatusLabel }}
          </div>
          <h2 class="mt-4 text-2xl font-black tracking-tight text-[#fff0cf]">
            Modifiche alle squadre
          </h2>
          <p class="gold-copy mt-3 text-sm leading-6">
            {{ teamStatusDescription }}
          </p>
        </div>

        <button
          @click="toggleLockedTeamEditability"
          :disabled="isSettingsLoading || isAnySettingsSaving"
          class="gold-button rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ teamButtonLabel }}
        </button>
      </div>
    </div>

    <div class="surface-card rounded-2xl p-6 sm:p-8">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="max-w-2xl">
          <div class="status-badge inline-flex rounded-full px-4 py-2 text-sm font-semibold">
            {{ signupStatusLabel }}
          </div>
          <h2 class="mt-4 text-2xl font-black tracking-tight text-[#fff0cf]">
            Nuove iscrizioni
          </h2>
          <p class="gold-copy mt-3 text-sm leading-6">
            {{ signupStatusDescription }}
          </p>
        </div>

        <button
          @click="toggleNewUserSignups"
          :disabled="isSettingsLoading || isAnySettingsSaving"
          class="gold-button rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ signupButtonLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
