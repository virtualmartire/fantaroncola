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
  <div class="surface-card overflow-hidden rounded-2xl">
    <div class="px-4 py-5 sm:px-6">
      <p class="gold-kicker text-sm font-semibold uppercase">Notte degli Oscar</p>
      <h1 class="mt-2 text-2xl font-black tracking-tight text-[#fff0cf]">Classifica</h1>
      <p class="gold-copy mt-1 max-w-2xl text-sm">
        Segui l'andamento del fantaconcorso e scopri chi sta dominando la gara.
      </p>
    </div>

    <div v-if="leaderboard.length === 0" class="table-divider px-4 py-10 text-center text-sm gold-copy">
      La classifica si popolera non appena saranno disponibili i primi punteggi.
    </div>

    <div v-else class="table-divider">
      <div
        v-for="entry in leaderboard"
        :key="entry.rank"
        class="table-row grid grid-cols-3 items-center gap-4 px-4 py-5 sm:px-6"
        :class="entry.rank === 1 ? 'table-row-featured' : ''"
      >
        <div class="text-sm font-semibold" :class="entry.rank === 1 ? 'text-[#ffe09a]' : 'gold-muted'">
          #{{ entry.rank }}
        </div>
        <div class="text-sm font-bold" :class="entry.rank === 1 ? 'text-[#fff3db]' : 'text-[#f4e3be]'">
          {{ entry.user }}
        </div>
        <div class="text-right text-sm" :class="entry.rank === 1 ? 'text-[#ffe09a]' : 'text-[#f4e3be]'">
          {{ entry.points }} punti
        </div>
      </div>
    </div>
  </div>
</template>
