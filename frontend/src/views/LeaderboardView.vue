<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../services/api'

const leaderboard = ref([])

const getRowClass = (rank) => {
  if (rank === 1) {
    return 'bg-[linear-gradient(90deg,rgba(224,191,115,0.18),rgba(255,255,255,0.03))]'
  }

  if (rank === 2) {
    return 'bg-[linear-gradient(90deg,rgba(214,214,214,0.1),rgba(255,255,255,0.02))]'
  }

  if (rank === 3) {
    return 'bg-[linear-gradient(90deg,rgba(176,121,67,0.14),rgba(255,255,255,0.02))]'
  }

  return 'bg-transparent'
}

const getBadgeClass = (rank) => {
  if (rank === 1) {
    return 'border border-[#e0bf73] bg-[#e0bf73] text-[#171006]'
  }

  if (rank === 2) {
    return 'border border-[#d1d5db] bg-[#d1d5db] text-[#171006]'
  }

  if (rank === 3) {
    return 'border border-[#b77943] bg-[#b77943] text-[#171006]'
  }

  return 'border border-[rgba(224,191,115,0.14)] bg-[rgba(255,255,255,0.03)] text-[#f4deb1]'
}

const fetchLeaderboard = async () => {
  try {
    const data = await api.get('/leaderboard')
    leaderboard.value = data
      .filter((entry) => entry.username?.trim().toLowerCase() !== 'admin')
      .map((entry, index) => {
      const day1 = parseInt(entry.day1_score, 10) || 0
      const day2 = parseInt(entry.day2_score, 10) || 0
      const day3 = parseInt(entry.day3_score, 10) || 0

      return {
        rank: index + 1,
        user: entry.username,
        day1,
        day2,
        day3,
        total: day1 + day2 + day3,
      }
      })
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
      <h1 class="mt-2 text-2xl font-black tracking-tight text-[#fff0cf]">Classifica</h1>
      <p class="gold-copy mt-1 max-w-2xl text-sm">
        Vista dei punteggi di ogni utente per ciascuna serata.
      </p>
    </div>

    <div v-if="leaderboard.length === 0" class="table-divider px-4 py-10 text-center text-sm gold-copy">
      La classifica si popolera non appena saranno disponibili i primi punteggi.
    </div>

    <div v-else class="table-divider">
      <table class="w-full table-fixed border-collapse">
        <thead>
          <tr class="bg-[rgba(255,255,255,0.03)] text-left text-xs uppercase tracking-[0.16em] text-[#c9ab67]">
            <th class="w-[32%] px-3 py-4 font-semibold sm:px-6">Nome utente</th>
            <th class="w-[17%] px-2 py-4 text-center font-semibold sm:px-4">
              <span class="sm:hidden">S1</span>
              <span class="hidden sm:inline">Serata 1</span>
            </th>
            <th class="w-[17%] px-2 py-4 text-center font-semibold sm:px-4">
              <span class="sm:hidden">S2</span>
              <span class="hidden sm:inline">Serata 2</span>
            </th>
            <th class="w-[17%] px-2 py-4 text-center font-semibold sm:px-4">
              <span class="sm:hidden">S3</span>
              <span class="hidden sm:inline">Serata 3</span>
            </th>
            <th class="w-[17%] px-2 py-4 text-center font-semibold sm:px-4">
              <span class="sm:hidden">Tot</span>
              <span class="hidden sm:inline">Totale</span>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="entry in leaderboard"
            :key="entry.rank"
            class="border-t border-[rgba(224,191,115,0.12)]"
            :class="getRowClass(entry.rank)"
          >
            <td class="px-3 py-4 align-middle sm:px-6">
              <div class="flex items-center gap-3">
                <span
                  class="inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-black"
                  :class="getBadgeClass(entry.rank)"
                >
                  {{ entry.rank }}
                </span>
                <span class="min-w-0 whitespace-normal break-words text-sm font-semibold leading-5 text-[#f7e8c6]">
                  {{ entry.user }}
                </span>
              </div>
            </td>
            <td class="px-2 py-4 text-center text-sm font-medium text-[#ead7af] sm:px-4">{{ entry.day1 }}</td>
            <td class="px-2 py-4 text-center text-sm font-medium text-[#ead7af] sm:px-4">{{ entry.day2 }}</td>
            <td class="px-2 py-4 text-center text-sm font-medium text-[#ead7af] sm:px-4">{{ entry.day3 }}</td>
            <td class="px-2 py-4 text-center text-sm font-semibold text-[#f4deb1] sm:px-4">{{ entry.total }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
