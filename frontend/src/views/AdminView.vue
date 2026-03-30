<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../services/api'

const singers = ref([])
const newSinger = ref({ name: '', description: '', cost: 0, image: '' })
const isEditing = ref(null)
const editForm = ref({ name: '', description: '', cost: 0, image: '', total_score: 0 })

const fetchSingers = async () => {
  try {
    singers.value = await api.get('/singers')
  } catch (error) {
    console.error(error)
  }
}

const addSinger = async () => {
  try {
    await api.post('/singers', newSinger.value)
    newSinger.value = { name: '', description: '', cost: 0, image: '' }
    fetchSingers()
  } catch (error) {
    alert(error.message)
  }
}

const deleteSinger = async (id) => {
  if (!confirm('Vuoi davvero eliminare questo cantante?')) {
    return
  }

  try {
    await api.request(`/singers/${id}`, 'DELETE')
    fetchSingers()
  } catch (error) {
    alert(error.message)
  }
}

const startEdit = (singer) => {
  isEditing.value = singer.id
  editForm.value = { ...singer }
}

const cancelEdit = () => {
  isEditing.value = null
  editForm.value = { name: '', description: '', cost: 0, image: '', total_score: 0 }
}

const saveSinger = async () => {
  try {
    await api.request(`/singers/${isEditing.value}`, 'PUT', editForm.value)
    isEditing.value = null
    fetchSingers()
  } catch (error) {
    alert(error.message)
  }
}

onMounted(fetchSingers)
</script>

<template>
  <div class="space-y-8">
    <div>
      <p class="gold-kicker text-sm font-semibold uppercase">Backstage</p>
      <h1 class="mt-2 text-3xl font-black tracking-tight text-[#fff0cf]">Pannello admin</h1>
      <p class="gold-copy mt-2 text-sm">
        Gestisci il cast del fantaconcorso, aggiorna i dati dei cantanti e controlla i punteggi.
      </p>
    </div>

    <div class="surface-card rounded-2xl p-6">
      <h2 class="mb-4 text-xl font-bold text-[#fff0cf]">Aggiungi un cantante</h2>
      <form @submit.prevent="addSinger" class="grid grid-cols-1 items-end gap-4 sm:grid-cols-4">
        <div>
          <label class="field-label block text-sm font-medium">Nome</label>
          <input v-model="newSinger.name" type="text" required class="field-input mt-1 block p-2 shadow-sm sm:text-sm">
        </div>
        <div>
          <label class="field-label block text-sm font-medium">Descrizione</label>
          <input v-model="newSinger.description" type="text" class="field-input mt-1 block p-2 shadow-sm sm:text-sm">
        </div>
        <div>
          <label class="field-label block text-sm font-medium">Costo</label>
          <input v-model.number="newSinger.cost" type="number" required class="field-input mt-1 block p-2 shadow-sm sm:text-sm">
        </div>
        <div>
          <label class="field-label block text-sm font-medium">URL immagine</label>
          <input v-model="newSinger.image" type="text" class="field-input mt-1 block p-2 shadow-sm sm:text-sm">
        </div>
        <button type="submit" class="gold-button rounded-xl px-4 py-2 font-semibold transition">
          Aggiungi
        </button>
      </form>
    </div>

    <div class="surface-card overflow-hidden rounded-2xl">
      <ul class="divide-y divide-[rgba(224,191,115,0.12)]">
        <li v-for="singer in singers" :key="singer.id" class="px-4 py-4 sm:px-6">
          <div v-if="isEditing === singer.id" class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="field-label block text-sm font-medium">Nome</label>
                <input v-model="editForm.name" type="text" class="field-input mt-1 block p-2 shadow-sm sm:text-sm">
              </div>
              <div>
                <label class="field-label block text-sm font-medium">Descrizione</label>
                <input v-model="editForm.description" type="text" class="field-input mt-1 block p-2 shadow-sm sm:text-sm">
              </div>
              <div>
                <label class="field-label block text-sm font-medium">Costo</label>
                <input v-model.number="editForm.cost" type="number" class="field-input mt-1 block p-2 shadow-sm sm:text-sm">
              </div>
              <div>
                <label class="field-label block text-sm font-medium">URL immagine</label>
                <input v-model="editForm.image" type="text" class="field-input mt-1 block p-2 shadow-sm sm:text-sm">
              </div>
              <div>
                <label class="field-label block text-sm font-medium">Punteggio totale</label>
                <input v-model.number="editForm.total_score" type="number" class="field-input mt-1 block p-2 shadow-sm sm:text-sm">
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <button @click="saveSinger" class="gold-button rounded-xl px-3 py-2 font-semibold transition">
                Salva
              </button>
              <button @click="cancelEdit" class="ghost-button rounded-xl px-3 py-2 font-semibold transition">
                Annulla
              </button>
            </div>
          </div>

          <div v-else class="flex items-center justify-between gap-4">
            <div class="flex items-center">
              <div class="h-10 w-10 flex-shrink-0">
                <img class="h-10 w-10 rounded-full object-cover" :src="singer.image" :alt="singer.name">
              </div>
              <div class="ml-4">
                <div class="truncate text-sm font-medium text-[#ffe09a]">{{ singer.name }}</div>
                <div class="gold-copy text-sm">{{ singer.description }}</div>
                <div class="gold-muted text-sm">
                  Costo: {{ singer.cost }} | Punteggio: {{ singer.total_score }}
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="startEdit(singer)" class="text-button text-sm font-medium transition">
                Modifica
              </button>
              <button @click="deleteSinger(singer.id)" class="text-sm font-medium text-[#f2a8a3] transition hover:text-[#ffd0cc]">
                Elimina
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
