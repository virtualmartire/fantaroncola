<script setup>
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const highlights = [
  {
    value: '5',
    label: 'cantanti da schierare',
  },
  {
    value: '100',
    label: 'roncoli a disposizione',
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
    description: 'Componi una squadra di 5 cantanti senza sforare i roncoli disponibili.',
  },
  {
    title: 'Segui la classifica',
    description: 'Controlla i punteggi e scopri chi vola verso la vetta del concorso.',
  },
]

const strengths = [
  'Perfetto per seguire un contest musicale con amici, community o colleghi.',
  'Ogni scelta conta: bilancia nomi forti, sorprese e roncoli rimasti.',
  'Quando sei soddisfatto puoi bloccare la squadra e giocarti tutto fino alla fine.',
]
</script>

<template>
  <div class="space-y-12 py-4 sm:py-8">
    <section class="hero-surface overflow-hidden rounded-[2rem]">
      <div class="grid gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-12 lg:py-14">
        <div class="space-y-6">
          <span class="gold-pill inline-flex items-center rounded-full px-4 py-1 text-sm font-medium backdrop-blur">
            Fantaconcorso di cantanti
          </span>
          <div class="space-y-4">
            <h1 class="max-w-3xl text-4xl font-black tracking-tight text-[#fff3db] sm:text-5xl">
              Scegli la tua squadra, gestisci i roncoli e punta alla vetta di FantaRoncola.
            </h1>
            <p class="gold-copy max-w-2xl text-lg">
              Una serata da red carpet trasformata in gioco: segui il concorso musicale con piu pathos,
              selezioni 5 artisti, confermi la rosa e aspetti che i punti facciano la differenza.
            </p>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row">
            <RouterLink
              :to="authStore.isAuthenticated ? '/team' : '/accedi'"
              class="gold-button inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition"
            >
              {{ authStore.isAuthenticated ? 'Vai alla mia squadra' : 'Accedi o registrati' }}
            </RouterLink>
            <a
              href="#come-funziona"
              class="ghost-button inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition"
            >
              Scopri come funziona
            </a>
          </div>
        </div>

        <div class="surface-card-soft rounded-3xl p-6 backdrop-blur">
          <p class="gold-kicker text-sm font-semibold uppercase">
            Il gioco in breve
          </p>
          <div class="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div
              v-for="item in highlights"
              :key="item.label"
              class="gold-stat rounded-2xl px-5 py-4"
            >
              <div class="text-3xl font-black text-[#ffe9b0]">{{ item.value }}</div>
              <div class="gold-copy mt-1 text-sm">{{ item.label }}</div>
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
        class="surface-card rounded-2xl p-6"
      >
        <div class="gold-pill flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
          {{ index + 1 }}
        </div>
        <h2 class="mt-4 text-xl font-bold text-[#fff0cf]">{{ step.title }}</h2>
        <p class="gold-copy mt-2 text-sm leading-6">{{ step.description }}</p>
      </article>
    </section>

    <section class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div class="surface-card rounded-3xl p-8">
        <p class="gold-kicker text-sm font-semibold uppercase">
          Perche partecipare
        </p>
        <h2 class="mt-3 text-3xl font-black tracking-tight text-[#fff0cf]">
          Il fantaconcorso che trasforma ogni esibizione in una scelta strategica.
        </h2>
        <div class="mt-6 space-y-4">
          <div
            v-for="item in strengths"
            :key="item"
            class="gold-stat rounded-2xl px-5 py-4 text-sm leading-6 text-[#ead7af]"
          >
            {{ item }}
          </div>
        </div>
      </div>

      <div class="surface-card rounded-3xl p-8">
        <p class="gold-kicker text-sm font-semibold uppercase">
          La tua missione
        </p>
        <h2 class="mt-3 text-2xl font-black tracking-tight text-[#fff0cf]">
          Costruisci la rosa migliore prima che i giochi siano fatti.
        </h2>
        <p class="gold-copy mt-4 text-sm leading-6">
          Hai 100 roncoli e solo 5 slot disponibili. Scegli i cantanti giusti,
          controlla la classifica e difendi il tuo posto fino all'ultimo aggiornamento.
        </p>
        <div class="mt-8 space-y-3 text-sm text-[#ead7af]">
          <div class="gold-stat rounded-2xl px-4 py-3">
            Rosa da 5 cantanti con massimo 100 roncoli.
          </div>
          <div class="gold-stat rounded-2xl px-4 py-3">
            Possibilita di bloccare la squadra quando sei convinto delle tue scelte.
          </div>
          <div class="gold-stat rounded-2xl px-4 py-3">
            Classifica aggiornata in base ai punteggi del contest.
          </div>
        </div>
      </div>
    </section>

    <section class="hero-surface rounded-3xl px-6 py-8 text-center sm:px-10">
      <h2 class="text-3xl font-black tracking-tight text-[#fff3db]">
        Pronto a giocarti il titolo?
      </h2>
      <p class="gold-copy mx-auto mt-3 max-w-2xl text-base">
        Entra in FantaRoncola, crea la tua squadra di cantanti e scopri chi domina il fantaconcorso.
      </p>
      <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <RouterLink
          :to="authStore.isAuthenticated ? '/team' : '/accedi'"
          class="gold-button inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition"
        >
          {{ authStore.isAuthenticated ? 'Apri la squadra' : 'Inizia subito' }}
        </RouterLink>
        <RouterLink
          v-if="authStore.isAuthenticated"
          to="/leaderboard"
          class="ghost-button inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition"
        >
          Guarda la classifica
        </RouterLink>
      </div>
    </section>
  </div>
</template>
