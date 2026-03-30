<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../services/api'

const singerScores = ref([])

const getSeedOrder = (seedKey) => {
  const match = seedKey?.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER
}

const fetchSingerScores = async () => {
  try {
    const data = await api.get('/singers')
    singerScores.value = [...data]
      .sort((left, right) => getSeedOrder(left.seed_key) - getSeedOrder(right.seed_key))
      .map((singer) => ({
        id: singer.id,
        name: singer.name,
        songTitle: singer.song_title,
        day1: parseInt(singer.day1_score, 10) || 0,
        day2: parseInt(singer.day2_score, 10) || 0,
        day3: parseInt(singer.day3_score, 10) || 0,
      }))
  } catch (error) {
    console.error('Errore nel caricamento dei punteggi dei cantanti:', error)
  }
}

onMounted(() => {
  fetchSingerScores()
})
</script>

<template>
  <div class="surface-card overflow-hidden rounded-2xl">
    <div class="px-4 py-5 sm:px-6">
      <p class="gold-kicker text-sm font-semibold uppercase">Punteggi cantanti</p>
      <h1 class="mt-2 text-2xl font-black tracking-tight text-[#fff0cf]">Serate dei cantanti</h1>
      <p class="gold-copy mt-1 max-w-2xl text-sm">
        La tabella dei punteggi dei singoli cantanti, organizzata per serata.
      </p>
    </div>

    <div v-if="singerScores.length === 0" class="table-divider px-4 py-10 text-center text-sm gold-copy">
      I punteggi dei cantanti compariranno qui non appena saranno disponibili.
    </div>

    <div v-else class="table-divider">
      <table class="w-full table-fixed border-collapse">
        <thead>
          <tr class="bg-[rgba(255,255,255,0.03)] text-left text-xs uppercase tracking-[0.16em] text-[#c9ab67]">
            <th class="w-[46%] px-3 py-4 font-semibold sm:px-6">Cantante</th>
            <th class="w-[18%] px-2 py-4 text-center font-semibold sm:px-4">
              <span class="sm:hidden">S1</span>
              <span class="hidden sm:inline">Serata 1</span>
            </th>
            <th class="w-[18%] px-2 py-4 text-center font-semibold sm:px-4">
              <span class="sm:hidden">S2</span>
              <span class="hidden sm:inline">Serata 2</span>
            </th>
            <th class="w-[18%] px-2 py-4 text-center font-semibold sm:px-4">
              <span class="sm:hidden">S3</span>
              <span class="hidden sm:inline">Serata 3</span>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="singer in singerScores"
            :key="singer.id"
            class="border-t border-[rgba(224,191,115,0.12)]"
          >
            <td class="px-3 py-4 align-middle sm:px-6">
              <div class="min-w-0">
                <div class="break-words text-sm font-semibold leading-5 text-[#f7e8c6]">
                  {{ singer.name }}
                </div>
                <div class="mt-1 break-words text-xs font-medium text-[#e0bf73]">
                  {{ singer.songTitle }}
                </div>
              </div>
            </td>
            <td class="px-2 py-4 text-center text-sm font-medium text-[#ead7af] sm:px-4">{{ singer.day1 }}</td>
            <td class="px-2 py-4 text-center text-sm font-medium text-[#ead7af] sm:px-4">{{ singer.day2 }}</td>
            <td class="px-2 py-4 text-center text-sm font-medium text-[#ead7af] sm:px-4">{{ singer.day3 }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
