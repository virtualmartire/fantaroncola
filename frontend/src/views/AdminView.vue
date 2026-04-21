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
const adminStats = ref({
  registeredUsers: 0,
  confirmedTeams: 0,
})

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

onMounted(() => {
  fetchAdminSettings()
  fetchAdminStats()
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
