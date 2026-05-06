import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api'

export const useGameStore = defineStore('game', () => {
  const singers = ref([])
  /** Persisted roster from the server */
  const userTeam = ref([])
  /** Local working copy; changes apply on confirm */
  const draftTeam = ref([])
  const teamLimits = {
    adulti: 2,
    bambini: 2,
  }

  function syncDraftFromCommitted() {
    draftTeam.value = userTeam.value.map((singer) => ({ ...singer }))
  }

  const selectedCounts = computed(() => draftTeam.value.reduce((counts, singer) => {
    const category = singer.category || 'adulti'
    counts[category] = (counts[category] || 0) + 1
    return counts
  }, { adulti: 0, bambini: 0 }))

  const committedSelectedCounts = computed(() => userTeam.value.reduce((counts, singer) => {
    const category = singer.category || 'adulti'
    counts[category] = (counts[category] || 0) + 1
    return counts
  }, { adulti: 0, bambini: 0 }))

  const totalSlots = computed(() => Object.values(teamLimits).reduce((sum, limit) => sum + limit, 0))
  const isTeamFull = computed(() => draftTeam.value.length >= totalSlots.value)
  const isTeamComplete = computed(() => Object.entries(teamLimits).every(([category, limit]) => (
    (selectedCounts.value[category] || 0) === limit
  )))
  const isCommittedTeamComplete = computed(() => Object.entries(teamLimits).every(([category, limit]) => (
    (committedSelectedCounts.value[category] || 0) === limit
  )))

  const hasDraftChanges = computed(() => {
    const a = [...userTeam.value.map((s) => s.id)].sort((x, y) => x - y).join(',')
    const b = [...draftTeam.value.map((s) => s.id)].sort((x, y) => x - y).join(',')
    return a !== b
  })

  function categoryLabel(category) {
    return category === 'bambini' ? 'bambini' : 'adulti'
  }

  function remainingSlotsForCategory(category) {
    return Math.max(0, teamLimits[category] - (selectedCounts.value[category] || 0))
  }

  function isSingerUnavailable(singer) {
    return singer?.is_available === false
  }

  function hadSingerInCommittedTeam(singerId) {
    return userTeam.value.some((selectedSinger) => selectedSinger.id === singerId)
  }

  function canSelectSinger(singer) {
    if (draftTeam.value.find((selectedSinger) => selectedSinger.id === singer.id)) return false

    const category = singer.category || 'adulti'
    if (!teamLimits[category]) return false

    if (isSingerUnavailable(singer) && !hadSingerInCommittedTeam(singer.id)) return false

    return remainingSlotsForCategory(category) > 0
  }

  async function fetchSingers() {
    try {
      const data = await api.get('/singers')
      singers.value = data
    } catch (error) {
      console.error('Errore nel caricamento dei cantanti:', error)
    }
  }

  async function fetchTeam() {
    try {
      const data = await api.get('/team')
      userTeam.value = data
      syncDraftFromCommitted()
    } catch (error) {
      console.error('Errore nel caricamento della squadra:', error)
      userTeam.value = []
      draftTeam.value = []
    }
  }

  function addSinger(singer) {
    if (!canSelectSinger(singer)) return
    draftTeam.value = [...draftTeam.value, { ...singer }]
  }

  function removeSinger(singerId) {
    draftTeam.value = draftTeam.value.filter((s) => s.id !== singerId)
  }

  function discardDraftChanges() {
    syncDraftFromCommitted()
  }

  async function persistDraftTeam() {
    if (!isTeamComplete.value) {
      throw new Error('La squadra deve avere esattamente 2 adulti e 2 bambini')
    }
    const singerIds = draftTeam.value.map((s) => s.id)
    const updated = await api.request('/team', 'PUT', { singerIds })
    userTeam.value = updated
    syncDraftFromCommitted()
  }

  async function lockTeam() {
    try {
      await api.post('/team/lock', {})
    } catch (error) {
      throw error
    }
  }

  return {
    singers,
    userTeam,
    draftTeam,
    teamLimits,
    selectedCounts,
    totalSlots,
    isTeamFull,
    isTeamComplete,
    isCommittedTeamComplete,
    hasDraftChanges,
    categoryLabel,
    remainingSlotsForCategory,
    isSingerUnavailable,
    canSelectSinger,
    fetchSingers,
    fetchTeam,
    addSinger,
    removeSinger,
    discardDraftChanges,
    persistDraftTeam,
    lockTeam,
  }
})
