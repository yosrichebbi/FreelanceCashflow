<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
    <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p class="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{{ t.safeToSpend }}</p>
      <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {{ formatCurrency(metrics.safeToSpend) }}
      </p>
      <dl class="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
        <div class="flex justify-between gap-2">
          <dt class="text-slate-500">{{ t.bankBalance }}</dt>
          <dd class="font-medium text-slate-800">{{ formatCurrency(metrics.latestBalance) }}</dd>
        </div>
        <div class="flex justify-between gap-2">
          <dt class="text-slate-500">{{ t.vatReserve }}</dt>
          <dd class="font-medium text-slate-800">−{{ formatCurrency(metrics.vatReserve) }}</dd>
        </div>
        <div class="flex justify-between gap-2">
          <dt class="text-slate-500">{{ t.novemberFixed }}</dt>
          <dd class="font-medium text-slate-800">−{{ formatCurrency(metrics.recurringBurn) }}</dd>
        </div>
      </dl>
      <p class="mt-3 text-xs text-slate-500">{{ t.reserveEstimate }}</p>
    </article>

    <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p class="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{{ t.burn }}</p>
      <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {{ formatCurrency(metrics.recurringBurn) }}
        <span class="text-sm font-medium text-slate-500">{{ t.burnMonth }}</span>
      </p>
      <div class="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <p v-if="metrics.exceptionalExpenses.length">
          {{ metrics.exceptionalExpenses.length }}
          {{ metrics.exceptionalExpenses.length === 1 ? t.excludedOneOff : t.excludedOneOffs }}:
        </p>
        <p
          v-for="(item, index) in metrics.exceptionalExpenses"
          :key="`${item.date}-${index}`"
          class="mt-1 font-medium text-slate-700"
        >
          {{ item.label.replace(/^(CB|PRLV SEPA)\s*/i, '') }}
          (−{{ formatCurrency(item.amount) }})
        </p>
        <details v-if="metrics.latestRecurring.length" class="mt-3">
          <summary class="cursor-pointer font-semibold text-indigo-700 hover:text-indigo-900">
            {{ t.viewRecurring.replace('{count}', metrics.latestRecurring.length) }}
          </summary>
          <ul class="mt-2 space-y-1">
            <li
              v-for="(item, index) in metrics.latestRecurring"
              :key="`recurring-${item.date}-${index}`"
              class="flex justify-between gap-2"
            >
              <span class="truncate">{{ item.label.replace(/^(CB|PRLV SEPA|VIR SEPA|VIR INSTANTANE)\s*/i, '') }}</span>
              <span class="shrink-0">{{ formatCurrency(item.amount) }}</span>
            </li>
          </ul>
        </details>
      </div>
    </article>

    <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p class="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{{ t.runway }}</p>
      <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {{ metrics.runwayDays }}
        <span class="text-sm font-medium text-slate-500">
          {{ t.days }} ({{ (metrics.runwayDays / 30).toFixed(1) }} {{ t.month }})
        </span>
      </p>
      <dl class="mt-4 border-t border-slate-100 pt-3 text-xs">
        <div class="flex flex-wrap justify-between gap-2">
          <dt class="text-slate-500">{{ t.zeroCash }}</dt>
          <dd class="font-semibold text-slate-800">{{ zeroCashDate }}</dd>
        </div>
      </dl>
    </article>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { translations } from '../utils/i18n';

const props = defineProps({
  metrics: { type: Object, required: true },
  lang: { type: String, default: 'fr' }
});

const t = computed(() => translations[props.lang].mvp);
const zeroCashDate = computed(() => {
  const date = new Date(`${props.metrics.latestDate}T12:00:00`);
  date.setDate(date.getDate() + props.metrics.runwayDays + 1);
  return new Intl.DateTimeFormat(props.lang === 'fr' ? 'fr-FR' : 'en-IE', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
});

function formatCurrency(value) {
  return new Intl.NumberFormat(props.lang === 'fr' ? 'fr-FR' : 'en-IE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}
</script>
