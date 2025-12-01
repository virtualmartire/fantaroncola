<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../services/api';

const singers = ref([]);
const newSinger = ref({ name: '', description: '', cost: 0, image: '' });
const isEditing = ref(null);
const editForm = ref({ name: '', description: '', cost: 0, image: '', total_score: 0 });

const fetchSingers = async () => {
  try {
    singers.value = await api.get('/singers');
  } catch (error) {
    console.error(error);
  }
};

const addSinger = async () => {
  try {
    await api.post('/singers', newSinger.value);
    newSinger.value = { name: '', description: '', cost: 0, image: '' };
    fetchSingers();
  } catch (error) {
    alert(error.message);
  }
};

const deleteSinger = async (id) => {
  if (!confirm('Are you sure?')) return;
  try {
    await api.request(`/singers/${id}`, 'DELETE');
    fetchSingers();
  } catch (error) {
    alert(error.message);
  }
};

const startEdit = (singer) => {
  isEditing.value = singer.id;
  editForm.value = { ...singer };
};

const cancelEdit = () => {
  isEditing.value = null;
  editForm.value = { name: '', description: '', cost: 0, image: '', total_score: 0 };
};

const saveSinger = async () => {
  try {
    await api.request(`/singers/${isEditing.value}`, 'PUT', editForm.value);
    isEditing.value = null;
    fetchSingers();
  } catch (error) {
    alert(error.message);
  }
};

onMounted(fetchSingers);
</script>

<template>
  <div class="space-y-8">
    <h1 class="text-2xl font-bold">Admin Panel</h1>

    <!-- Add Singer -->
    <div class="bg-white p-6 rounded-lg shadow">
      <h2 class="text-lg font-bold mb-4">Add New Singer</h2>
      <form @submit.prevent="addSinger" class="grid grid-cols-1 gap-4 sm:grid-cols-4 items-end">
        <div>
          <label class="block text-sm font-medium text-gray-700">Name</label>
          <input v-model="newSinger.name" type="text" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Description</label>
          <input v-model="newSinger.description" type="text" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Cost</label>
          <input v-model.number="newSinger.cost" type="number" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Image URL</label>
          <input v-model="newSinger.image" type="text" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2">
        </div>
        <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700">Add</button>
      </form>
    </div>

    <!-- List Singers -->
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200">
        <li v-for="singer in singers" :key="singer.id" class="px-4 py-4 sm:px-6">
          <div v-if="isEditing === singer.id" class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700">Name</label>
                <input v-model="editForm.name" type="text" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <input v-model="editForm.description" type="text" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Cost</label>
                <input v-model.number="editForm.cost" type="number" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Image URL</label>
                <input v-model="editForm.image" type="text" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Total Score</label>
                <input v-model.number="editForm.total_score" type="number" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2">
              </div>
            </div>
            <div class="flex justify-end space-x-2">
              <button @click="saveSinger" class="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700">Save</button>
              <button @click="cancelEdit" class="bg-gray-500 text-white py-1 px-3 rounded hover:bg-gray-600">Cancel</button>
            </div>
          </div>
          <div v-else class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="flex-shrink-0 h-10 w-10">
                <img class="h-10 w-10 rounded-full object-cover" :src="singer.image" alt="" />
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-indigo-600 truncate">{{ singer.name }}</div>
                <div class="text-sm text-gray-500">{{ singer.description }}</div>
                <div class="text-sm text-gray-500">Cost: {{ singer.cost }} | Score: {{ singer.total_score }}</div>
              </div>
            </div>
            <div class="flex space-x-2">
              <button @click="startEdit(singer)" class="text-indigo-600 hover:text-indigo-900">Edit</button>
              <button @click="deleteSinger(singer.id)" class="text-red-600 hover:text-red-900">Delete</button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
