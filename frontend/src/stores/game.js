import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api'

export const useGameStore = defineStore('game', () => {
  const singers = ref([])
  const userTeam = ref([])
  const teamLimits = {
    adulti: 2,
    bambini: 2,
  }

  const selectedCounts = computed(() => userTeam.value.reduce((counts, singer) => {
    const category = singer.category || 'adulti'
    counts[category] = (counts[category] || 0) + 1
    return counts
  }, { adulti: 0, bambini: 0 }))

  const totalSlots = computed(() => Object.values(teamLimits).reduce((sum, limit) => sum + limit, 0))
  const isTeamFull = computed(() => userTeam.value.length >= totalSlots.value)
  const isTeamComplete = computed(() => Object.entries(teamLimits).every(([category, limit]) => (
    (selectedCounts.value[category] || 0) === limit
  )))

  function categoryLabel(category) {
    return category === 'bambini' ? 'bambini' : 'adulti'
  }

  function remainingSlotsForCategory(category) {
    return Math.max(0, teamLimits[category] - (selectedCounts.value[category] || 0))
  }

  function canSelectSinger(singer) {
    if (userTeam.value.find((selectedSinger) => selectedSinger.id === singer.id)) return false

    const category = singer.category || 'adulti'
    if (!teamLimits[category]) return false

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
    if (!localStorage.getItem('token')) {
      userTeam.value = []
      return
    }

    try {
      const data = await api.get('/team')
      userTeam.value = data
    } catch (error) {
      console.error('Errore nel caricamento della squadra:', error)
      userTeam.value = []
    }
  }

  async function addSinger(singer) {
    if (!canSelectSinger(singer)) return

    try {
      const updatedTeam = await api.post('/team', { singerId: singer.id })
      userTeam.value = updatedTeam
    } catch (error) {
      console.error('Errore durante l\'aggiunta del cantante:', error)
      alert(error.message)
    }
  }

  async function removeSinger(singerId) {
    try {
      const updatedTeam = await api.request(`/team/${singerId}`, 'DELETE')
      userTeam.value = updatedTeam
    } catch (error) {
      console.error('Errore durante la rimozione del cantante:', error)
    }
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
    teamLimits,
    selectedCounts,
    totalSlots,
    isTeamFull,
    isTeamComplete,
    categoryLabel,
    remainingSlotsForCategory,
    canSelectSinger,
    fetchSingers,
    fetchTeam,
    addSinger,
    removeSinger,
    lockTeam
  }
})
