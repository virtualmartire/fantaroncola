<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../services/api'

const leaderboard = ref([])

const fetchLeaderboard = async () => {
  try {
    const data = await api.get('/leaderboard')
    leaderboard.value = data.map((entry, index) => ({
      rank: index + 1,
      user: entry.username,
      points: parseInt(entry.total_score, 10),
    }))
  } catch (error) {
    console.error('Errore nel caricamento della classifica:', error)
  }
}

onMounted(() => {
  fetchLeaderboard()
})
</script>

<template>
  <div class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
    <div class="px-4 py-5 sm:px-6">
      <h1 class="text-2xl font-black tracking-tight text-gray-900">Classifica</h1>
      <p class="mt-1 max-w-2xl text-sm text-gray-500">
        Segui l'andamento del fantaconcorso e scopri chi sta dominando la gara.
      </p>
    </div>

    <div v-if="leaderboard.length === 0" class="border-t border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
      La classifica si popolera non appena saranno disponibili i primi punteggi.
    </div>

    <div v-else class="border-t border-gray-200">
      <div
        v-for="entry in leaderboard"
        :key="entry.rank"
        class="grid grid-cols-3 items-center gap-4 bg-gray-50 px-4 py-5 even:bg-white sm:px-6"
      >
        <div class="text-sm font-semibold text-gray-500">#{{ entry.rank }}</div>
        <div class="text-sm font-bold text-gray-900">{{ entry.user }}</div>
        <div class="text-right text-sm text-gray-900">{{ entry.points }} punti</div>
      </div>
    </div>
  </div>
</template>
