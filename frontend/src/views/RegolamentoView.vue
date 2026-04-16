<script setup>
const generalRules = [
  'I/le cantanti iscritti/e alla Roncola non possono partecipare al fanta',
  'Verrà accettata una sola squadra a persona',
  'Ogni iscritto dovrà scegliere 2 cantanti per categoria da inserire nella propria squadra',
  'Il vincitore del fanta verrà annunciato e premiato al termine della serata finale',
  'Ogni concorrente guadagnerà tanti punti quanti i bonus raccolti e ne perderà tanti quanti i malus assegnati',
]

const bonusItems = [
  { label: 'Standing ovation', points: 20 },
  { label: 'Arriva in finale', points: 20 },
  { label: 'Dedica la canzone a qualcuno', points: 5 },
  { label: 'Veste glitterato', points: 5 },
  { label: 'Ringrazia i tecnici', points: 5 },
  { label: 'Abbraccia una delle conduttrici', points: 5 },
  { label: 'Se dice «Roncola»', points: 5 },
  { label: 'Posta un selfie durante la serata taggando il profilo IG della Roncola', points: 10 },
  { label: 'Balla durante la performance', points: 10 },
  { label: 'Fa un inchino', points: 5 },
  { label: 'Suona uno strumento durante la performance', points: 10 },
  { label: 'Vince all’applausometro', points: 5 },
]

const malusItems = [
  { label: 'Cade sul palco', points: -20 },
  { label: 'Dimentica il testo', points: -15 },
  { label: 'Dice una parolaccia', points: -10 },
  { label: 'Total black', points: -5 },
  { label: 'Problemi tecnici', points: -5 },
  { label: 'La presentatrice sbaglia nome', points: -5 },
  { label: 'Inciampa sulle scale', points: -10 },
  { label: 'Nomina il FantaRoncola sul palco', points: -10 },
  { label: 'Cambia canzone all’ultimo', points: -10 },
  { label: 'Starnutisce mentre è sul palco', points: -10 },
  { label: 'La presentatrice sbaglia il titolo della canzone', points: -5 },
  { label: 'Si rompe l’abito', points: -10 },
]
</script>

<template>
  <div class="space-y-8 py-2 sm:py-4">
    <div class="surface-card rounded-2xl px-5 py-6 sm:px-8 sm:py-8">
      <p class="gold-kicker text-sm font-semibold uppercase">FantaRoncola</p>
      <h1 class="mt-2 text-2xl font-black tracking-tight text-[#fff0cf] sm:text-3xl">
        Regolamento Fanta Roncola
      </h1>
      <p class="gold-copy mt-3 max-w-3xl text-sm leading-6">
        Regole generali del gioco e tabella di bonus e malus assegnati durante le serate.
      </p>

      <ul class="mt-8 list-disc space-y-3 pl-5 text-sm leading-6 text-[#ead7af] marker:text-[#e0bf73]">
        <li v-for="(rule, index) in generalRules" :key="index">
          {{ rule }}
        </li>
      </ul>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <section class="surface-card rounded-2xl px-5 py-6 sm:px-7 sm:py-7">
        <h2 class="text-lg font-bold tracking-tight text-[#c9e8c4]">Bonus</h2>
        <p class="gold-muted mt-1 text-xs">
          Punti aggiunti al punteggio del cantante quando si verifica l’evento.
        </p>
        <ul class="mt-5 divide-y divide-[rgba(224,191,115,0.12)]">
          <li
            v-for="item in bonusItems"
            :key="item.label"
            class="flex items-start justify-between gap-4 py-3 first:pt-0"
          >
            <span class="text-sm leading-5 text-[#ead7af]">{{ item.label }}</span>
            <span class="shrink-0 text-sm font-semibold tabular-nums text-[#9fd4a4]">
              +{{ item.points }}
            </span>
          </li>
        </ul>
      </section>

      <section class="surface-card rounded-2xl px-5 py-6 sm:px-7 sm:py-7">
        <h2 class="text-lg font-bold tracking-tight text-[#f2a8a3]">Malus</h2>
        <p class="gold-muted mt-1 text-xs">
          Punti detratti dal punteggio del cantante quando si verifica l’evento.
        </p>
        <ul class="mt-5 divide-y divide-[rgba(224,191,115,0.12)]">
          <li
            v-for="item in malusItems"
            :key="item.label"
            class="flex items-start justify-between gap-4 py-3 first:pt-0"
          >
            <span class="text-sm leading-5 text-[#ead7af]">{{ item.label }}</span>
            <span class="shrink-0 text-sm font-semibold tabular-nums text-[#f2a8a3]">
              {{ item.points }}
            </span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
