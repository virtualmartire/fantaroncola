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
      <h1 class="text-3xl font-black tracking-tight text-gray-900">Pannello admin</h1>
      <p class="mt-2 text-sm text-gray-600">
        Gestisci il cast del fantaconcorso, aggiorna i dati dei cantanti e controlla i punteggi.
      </p>
    </div>

    <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <h2 class="mb-4 text-xl font-bold text-gray-900">Aggiungi un cantante</h2>
      <form @submit.prevent="addSinger" class="grid grid-cols-1 items-end gap-4 sm:grid-cols-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Nome</label>
          <input v-model="newSinger.name" type="text" required class="mt-1 block w-full rounded-xl border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Descrizione</label>
          <input v-model="newSinger.description" type="text" class="mt-1 block w-full rounded-xl border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Costo</label>
          <input v-model.number="newSinger.cost" type="number" required class="mt-1 block w-full rounded-xl border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">URL immagine</label>
          <input v-model="newSinger.image" type="text" class="mt-1 block w-full rounded-xl border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
        </div>
        <button type="submit" class="rounded-xl bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700">
          Aggiungi
        </button>
      </form>
    </div>

    <div class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
      <ul class="divide-y divide-gray-200">
        <li v-for="singer in singers" :key="singer.id" class="px-4 py-4 sm:px-6">
          <div v-if="isEditing === singer.id" class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700">Nome</label>
                <input v-model="editForm.name" type="text" class="mt-1 block w-full rounded-xl border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Descrizione</label>
                <input v-model="editForm.description" type="text" class="mt-1 block w-full rounded-xl border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Costo</label>
                <input v-model.number="editForm.cost" type="number" class="mt-1 block w-full rounded-xl border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">URL immagine</label>
                <input v-model="editForm.image" type="text" class="mt-1 block w-full rounded-xl border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Punteggio totale</label>
                <input v-model.number="editForm.total_score" type="number" class="mt-1 block w-full rounded-xl border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <button @click="saveSinger" class="rounded-xl bg-green-600 px-3 py-2 text-white transition hover:bg-green-700">
                Salva
              </button>
              <button @click="cancelEdit" class="rounded-xl bg-gray-500 px-3 py-2 text-white transition hover:bg-gray-600">
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
                <div class="truncate text-sm font-medium text-indigo-600">{{ singer.name }}</div>
                <div class="text-sm text-gray-500">{{ singer.description }}</div>
                <div class="text-sm text-gray-500">
                  Costo: {{ singer.cost }} | Punteggio: {{ singer.total_score }}
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="startEdit(singer)" class="text-sm font-medium text-indigo-600 transition hover:text-indigo-900">
                Modifica
              </button>
              <button @click="deleteSinger(singer.id)" class="text-sm font-medium text-red-600 transition hover:text-red-900">
                Elimina
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
