<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../services/api'

const leaderboard = ref([])

const fetchLeaderboard = async () => {
  try {
    const data = await api.get('/leaderboard');
    leaderboard.value = data.map((entry, index) => ({
      rank: index + 1,
      user: entry.username,
      points: parseInt(entry.total_score) // Ensure it's a number
    }));
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
  }
}

onMounted(() => {
  fetchLeaderboard();
})
</script>

<template>
  <div class="bg-white shadow overflow-hidden sm:rounded-lg">
    <div class="px-4 py-5 sm:px-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900">Leaderboard</h3>
      <p class="mt-1 max-w-2xl text-sm text-gray-500">Current standings for Roncola d'Oro.</p>
    </div>
    <div class="border-t border-gray-200">
      <div v-for="entry in leaderboard" :key="entry.rank" class="bg-gray-50 px-4 py-5 grid grid-cols-3 gap-4 sm:px-6 even:bg-white items-center">
        <div class="text-sm font-medium text-gray-500">#{{ entry.rank }}</div>
        <div class="text-sm text-gray-900 font-bold">{{ entry.user }}</div>
        <div class="text-sm text-gray-900 text-right">{{ entry.points }} pts</div>
      </div>
    </div>
  </div>
</template>
