<script setup>
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const highlights = [
  {
    value: '5',
    label: 'cantanti da schierare',
  },
  {
    value: '100',
    label: 'crediti di budget',
  },
  {
    value: 'Live',
    label: 'classifica sempre aggiornata',
  },
]

const steps = [
  {
    title: 'Crea il tuo account',
    description: 'Registrati in pochi secondi ed entra subito nel fantaconcorso.',
  },
  {
    title: 'Scegli i tuoi artisti',
    description: 'Componi una squadra di 5 cantanti senza sforare il budget disponibile.',
  },
  {
    title: 'Segui la classifica',
    description: 'Controlla i punteggi e scopri chi vola verso la vetta del concorso.',
  },
]

const strengths = [
  'Perfetto per seguire un contest musicale con amici, community o colleghi.',
  'Ogni scelta conta: bilancia nomi forti, sorprese e crediti rimasti.',
  'Quando sei soddisfatto puoi bloccare la squadra e giocarti tutto fino alla fine.',
]
</script>

<template>
  <div class="space-y-12 py-4 sm:py-8">
    <section class="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-fuchsia-600 text-white shadow-xl">
      <div class="grid gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-12 lg:py-14">
        <div class="space-y-6">
          <span class="inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-sm font-medium backdrop-blur">
            Fantaconcorso di cantanti
          </span>
          <div class="space-y-4">
            <h1 class="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              Scegli la tua squadra, gestisci il budget e punta alla vetta di FantaRoncola.
            </h1>
            <p class="max-w-2xl text-lg text-indigo-50">
              Un gioco semplice e competitivo per seguire il concorso musicale con piu pathos:
              selezioni 5 artisti, confermi la rosa e aspetti che i punti facciano la differenza.
            </p>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row">
            <RouterLink
              :to="authStore.isAuthenticated ? '/team' : '/accedi'"
              class="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              {{ authStore.isAuthenticated ? 'Vai alla mia squadra' : 'Accedi o registrati' }}
            </RouterLink>
            <a
              href="#come-funziona"
              class="inline-flex items-center justify-center rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Scopri come funziona
            </a>
          </div>
        </div>

        <div class="rounded-3xl bg-white/10 p-6 backdrop-blur">
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-100">
            Il gioco in breve
          </p>
          <div class="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div
              v-for="item in highlights"
              :key="item.label"
              class="rounded-2xl bg-white/10 px-5 py-4"
            >
              <div class="text-3xl font-black">{{ item.value }}</div>
              <div class="mt-1 text-sm text-indigo-100">{{ item.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section
      id="come-funziona"
      class="grid gap-4 lg:grid-cols-3"
    >
      <article
        v-for="(step, index) in steps"
        :key="step.title"
        class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
          {{ index + 1 }}
        </div>
        <h2 class="mt-4 text-xl font-bold text-gray-900">{{ step.title }}</h2>
        <p class="mt-2 text-sm leading-6 text-gray-600">{{ step.description }}</p>
      </article>
    </section>

    <section class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div class="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Perche partecipare
        </p>
        <h2 class="mt-3 text-3xl font-black tracking-tight text-gray-900">
          Il fantaconcorso che trasforma ogni esibizione in una scelta strategica.
        </h2>
        <div class="mt-6 space-y-4">
          <div
            v-for="item in strengths"
            :key="item"
            class="rounded-2xl bg-gray-50 px-5 py-4 text-gray-700"
          >
            {{ item }}
          </div>
        </div>
      </div>

      <div class="rounded-3xl bg-gray-900 p-8 text-white shadow-sm">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-200">
          La tua missione
        </p>
        <h2 class="mt-3 text-2xl font-black tracking-tight">
          Costruisci la rosa migliore prima che i giochi siano fatti.
        </h2>
        <p class="mt-4 text-sm leading-6 text-gray-300">
          Hai un budget limitato e solo 5 slot disponibili. Scegli i cantanti giusti,
          controlla la classifica e difendi il tuo posto fino all'ultimo aggiornamento.
        </p>
        <div class="mt-8 space-y-3 text-sm text-gray-200">
          <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            Rosa da 5 cantanti con budget massimo di 100 crediti.
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            Possibilita di bloccare la squadra quando sei convinto delle tue scelte.
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            Classifica aggiornata in base ai punteggi del contest.
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-3xl bg-indigo-50 px-6 py-8 text-center ring-1 ring-indigo-100 sm:px-10">
      <h2 class="text-3xl font-black tracking-tight text-gray-900">
        Pronto a giocarti il titolo?
      </h2>
      <p class="mx-auto mt-3 max-w-2xl text-base text-gray-600">
        Entra in FantaRoncola, crea la tua squadra di cantanti e scopri chi domina il fantaconcorso.
      </p>
      <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <RouterLink
          :to="authStore.isAuthenticated ? '/team' : '/accedi'"
          class="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          {{ authStore.isAuthenticated ? 'Apri la squadra' : 'Inizia subito' }}
        </RouterLink>
        <RouterLink
          v-if="authStore.isAuthenticated"
          to="/leaderboard"
          class="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
        >
          Guarda la classifica
        </RouterLink>
      </div>
    </section>
  </div>
</template>
