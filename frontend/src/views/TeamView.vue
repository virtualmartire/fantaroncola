<script setup>
import { useGameStore } from '../stores/game'
import { useAuthStore } from '../stores/auth'
import { onMounted } from 'vue'

const store = useGameStore()
const authStore = useAuthStore()
const { addSinger, removeSinger, fetchSingers, fetchTeam, lockTeam } = store

onMounted(() => {
  fetchSingers()
  fetchTeam()
})

const handleLockTeam = async () => {
    if (!confirm('Are you sure you want to lock your team? You will not be able to make changes.')) return;
    try {
        await lockTeam();
        authStore.fetchUser(); // Refresh user to get updated lock status
    } catch (error) {
        alert(error.message || 'Failed to lock team');
    }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Stats Bar -->
    <div class="bg-white p-4 rounded-lg shadow flex justify-between items-center sticky top-4 z-10">
      <div>
        <span class="text-gray-500">Budget:</span>
        <span class="text-2xl font-bold ml-2" :class="store.currentBudget < 10 ? 'text-red-500' : 'text-green-600'">{{ store.currentBudget }} / {{ store.maxBudget }}</span>
      </div>
      <div class="flex items-center space-x-4">
        <div>
            <span class="text-gray-500">Team:</span>
            <span class="text-2xl font-bold ml-2">{{ store.userTeam.length }} / 5</span>
        </div>
        <div v-if="authStore.user?.is_team_locked" class="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded">
            Team Locked
        </div>
        <button 
            v-else 
            @click="handleLockTeam"
            class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
            Confirm Team
        </button>
      </div>
    </div>

    <!-- My Team -->
    <section>
      <h2 class="text-xl font-bold mb-4">Your Team</h2>
      <div v-if="store.userTeam.length === 0" class="text-gray-500 italic bg-white p-8 rounded-lg text-center">
        No singers selected yet. Choose from the list below!
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div v-for="singer in store.userTeam" :key="singer.id" class="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500 relative group">
          <button v-if="!authStore.user?.is_team_locked" @click="removeSinger(singer.id)" class="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
            Remove
          </button>
          <div class="flex items-center justify-center mb-2">
            <img :src="singer.image" :alt="singer.name" class="h-20 w-20 object-cover rounded-full border-2 border-indigo-500">
          </div>
          <div class="font-bold text-lg text-center">{{ singer.name }}</div>
          <div class="text-gray-600 text-center">{{ singer.cost }} Credits</div>
        </div>
      </div>
    </section>

    <!-- Available Singers -->
    <section v-if="!authStore.user?.is_team_locked">
      <h2 class="text-xl font-bold mb-4">Available Singers</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div v-for="singer in store.singers" :key="singer.id" class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-3">
              <img :src="singer.image" :alt="singer.name" class="h-12 w-12 object-cover rounded-full">
              <div>
                <div class="font-bold">{{ singer.name }}</div>
                <div class="text-xs text-gray-500">{{ singer.description }}</div>
              </div>
            </div>
            <span class="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">{{ singer.cost }}</span>
          </div>
          
          <button 
            @click="addSinger(singer)" 
            :disabled="store.userTeam.find(s => s.id === singer.id) || (store.isTeamFull && !store.userTeam.find(s => s.id === singer.id)) || (store.currentBudget < singer.cost && !store.userTeam.find(s => s.id === singer.id))"
            class="w-full mt-2 py-2 px-4 rounded text-sm font-medium transition-colors"
            :class="store.userTeam.find(s => s.id === singer.id) 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : ((store.isTeamFull || store.currentBudget < singer.cost) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700')"
          >
            {{ store.userTeam.find(s => s.id === singer.id) ? 'Selected' : 'Add to Team' }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

