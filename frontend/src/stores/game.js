import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api'

export const useGameStore = defineStore('game', () => {
  const singers = ref([])
  const userTeam = ref([])
  const maxBudget = 100

  const currentBudget = computed(() => {
    const spent = userTeam.value.reduce((total, singer) => total + singer.cost, 0)
    return maxBudget - spent
  })

  const isTeamFull = computed(() => userTeam.value.length >= 5)

  async function fetchSingers() {
    try {
        const data = await api.get('/singers');
        singers.value = data;
    } catch (error) {
        console.error('Failed to fetch singers:', error);
    }
  }

  async function fetchTeam() {
      if (!localStorage.getItem('token')) {
          userTeam.value = [];
          return;
      }
      try {
          const data = await api.get('/team');
          userTeam.value = data;
      } catch (error) {
          console.error('Failed to fetch team:', error);
          userTeam.value = [];
      }
  }

  async function addSinger(singer) {
    if (userTeam.value.find(s => s.id === singer.id)) return
    if (userTeam.value.length >= 5) return
    if (currentBudget.value < singer.cost) return
    
    try {
        const updatedTeam = await api.post('/team', { singerId: singer.id });
        userTeam.value = updatedTeam;
    } catch (error) {
        console.error('Failed to add singer:', error);
        alert(error.message);
    }
  }

  async function removeSinger(singerId) {
    try {
        const updatedTeam = await api.request(`/team/${singerId}`, 'DELETE');
        userTeam.value = updatedTeam;
    } catch (error) {
        console.error('Failed to remove singer:', error);
    }
  }

  async function lockTeam() {
    try {
        await api.post('/team/lock', {});
    } catch (error) {
        throw error;
    }
  }

  return {
    singers,
    userTeam,
    maxBudget,
    currentBudget,
    isTeamFull,
    fetchSingers,
    fetchTeam,
    addSinger,
    removeSinger,
    lockTeam
  }
})
