<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../services/api'

const allowLockedTeamEdits = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)
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

const fetchTeamSettings = async () => {
  isLoading.value = true

  try {
    const data = await api.get('/team/settings')
    allowLockedTeamEdits.value = Boolean(data?.allow_locked_team_edits)
  } catch (error) {
    console.error('Errore nel caricamento delle impostazioni squadra:', error)
  } finally {
    isLoading.value = false
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

const toggleLockedTeamEditability = async () => {
  const willAllow = !allowLockedTeamEdits.value
  const message = willAllow
    ? 'Vuoi consentire agli utenti di modificare le squadre confermate?'
    : 'Vuoi impedire le modifiche alle squadre confermate?'

  if (!confirm(message)) {
    return
  }

  isSaving.value = true

  try {
    const data = await api.request('/team/settings', 'PUT', {
      allowLockedTeamEdits: willAllow,
    })

    allowLockedTeamEdits.value = Boolean(data?.allow_locked_team_edits)
  } catch (error) {
    alert(error.message)
  } finally {
    isSaving.value = false
  }
}

const statusLabel = computed(() => (
  allowLockedTeamEdits.value ? 'Modifiche abilitate' : 'Modifiche bloccate'
))

const statusDescription = computed(() => (
  allowLockedTeamEdits.value
    ? 'Gli utenti possono ancora modificare le squadre confermate.'
    : 'Le squadre confermate dagli utenti non sono più modificabili.'
))

const buttonLabel = computed(() => {
  if (isLoading.value) {
    return 'Caricamento...'
  }

  if (isSaving.value) {
    return 'Salvataggio...'
  }

  return allowLockedTeamEdits.value
    ? 'Blocca le squadre confermate'
    : 'Rendi modificabili le squadre confermate'
})

onMounted(() => {
  fetchTeamSettings()
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
            {{ statusLabel }}
          </div>
          <h2 class="mt-4 text-2xl font-black tracking-tight text-[#fff0cf]">
            Modifiche alle squadre
          </h2>
          <p class="gold-copy mt-3 text-sm leading-6">
            {{ statusDescription }}
          </p>
        </div>

        <button
          @click="toggleLockedTeamEditability"
          :disabled="isLoading || isSaving"
          class="gold-button rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ buttonLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
