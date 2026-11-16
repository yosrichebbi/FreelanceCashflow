<template>
  <div
    :lang="lang"
    class="min-h-screen bg-slate-50 text-slate-900"
    @dragover.prevent
    @drop.prevent="handleDrop"
  >
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
            CSV
          </div>
          <h1 class="text-lg font-bold tracking-tight">{{ appTitle }} <span class="text-slate-400">CSV</span></h1>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div v-if="metrics" class="hidden text-right sm:block">
            <p class="max-w-64 truncate text-sm font-medium text-slate-700">{{ fileName }}</p>
            <p class="text-xs text-slate-500">{{ t.fileDate }} {{ formatDate(metrics.latestDate) }}</p>
          </div>
          <div class="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1" :aria-label="lang === 'fr' ? 'Langue' : 'Language'">
            <button
              v-for="option in ['fr', 'en']"
              :key="option"
              type="button"
              class="rounded-md px-2.5 py-1 text-xs font-semibold transition"
              :class="lang === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
              :aria-pressed="lang === option"
              @click="lang = option"
            >
              {{ option.toUpperCase() }}
            </button>
          </div>
          <button
            type="button"
            class="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            @click="fileInput?.click()"
          >
            + {{ t.upload }}
          </button>
          <input
            id="csv-upload"
            ref="fileInput"
            class="sr-only"
            tabindex="-1"
            type="file"
            accept=".csv,text/csv"
            @change="handleFileUpload"
          />
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <section
        class="rounded-xl border-2 border-dashed text-center transition"
        :class="[
          metrics ? 'p-4 sm:p-5' : 'p-8',
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-white'
        ]"
        @dragenter.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
      >
        <p class="font-semibold">{{ t.dropTitle }}</p>
        <p class="mt-1 text-sm text-slate-500">{{ t.dropHint }}</p>
        <div class="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button type="button" class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" @click="fileInput?.click()">
            {{ t.upload }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            @click="loadSample"
          >
            {{ t.sample }}
          </button>
        </div>
      </section>

      <section v-if="requiresOpeningBalance" class="rounded-xl border border-slate-300 bg-white p-5">
        <label for="opening-balance" class="block text-sm font-semibold text-slate-900">{{ t.openingRequired }}</label>
        <p id="opening-help" class="mt-1 text-sm text-slate-600">{{ t.openingHelp }}</p>
        <input id="opening-balance" v-model="openingInput" type="number" step="0.01"
          aria-describedby="opening-help" class="mt-3 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2" />
      </section>

      <template v-if="metrics && metrics.latestBalance !== null">
        <section>
          <div class="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p class="text-xs font-bold tracking-[0.14em] text-indigo-600">01</p>
              <h2 class="mt-1 text-base font-bold text-slate-900">{{ t.summary }}</h2>
            </div>
            <p class="text-xs text-slate-500">{{ t.summaryHint }}</p>
          </div>
          <SurvivalCards
            :metrics="metrics"
            :lang="lang"
          />
        </section>

        <section>
          <div class="mb-3">
            <p class="text-xs font-bold tracking-[0.14em] text-indigo-600">02</p>
            <h2 class="mt-1 text-base font-bold text-slate-900">{{ t.scenariosHeading }}</h2>
          </div>
          <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <ScenarioSandbox
              v-model="scenarioState"
              :metrics="metrics"
              :scenario-buffer="scenarioBuffer"
              :lang="lang"
            />
            <CashProjectionChart
              :metrics="metrics"
              :scenarios="scenarioState"
              :lang="lang"
            />
          </div>
        </section>

        <section>
          <div class="mb-3">
            <p class="text-xs font-bold tracking-[0.14em] text-indigo-600">03</p>
            <h2 class="mt-1 text-base font-bold text-slate-900">{{ t.auditTitle }}</h2>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <h3 class="text-sm font-bold text-slate-900">{{ t.recurringFound }}</h3>
              <span class="text-sm font-semibold text-slate-700">
                {{ formatCurrency(metrics.recurringBurn) }}{{ t.burnMonth }}
              </span>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="(item, index) in metrics.latestRecurring"
                :key="`${item.date}-${index}`"
                class="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs text-slate-700"
              >
                {{ recurringSummary(item) }} ({{ formatCurrency(item.amount) }})
              </span>
              <span v-if="!metrics.latestRecurring.length" class="text-sm text-slate-500">
                {{ t.noRecurring }}
              </span>
            </div>
            <button
              v-if="metrics.latestRecurring.length"
              type="button"
              class="mt-3 text-xs font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900"
              :aria-expanded="showRecurring"
              @click="showRecurring = !showRecurring"
            >
              {{ showRecurring ? t.hideRecurring : t.viewRecurring.replace('{count}', metrics.latestRecurring.length) }}
            </button>
            <ul v-if="showRecurring" class="mt-3 grid gap-1 border-t border-slate-100 pt-3 sm:grid-cols-2">
              <li
                v-for="(item, index) in metrics.latestRecurring"
                :key="`detail-${item.date}-${index}`"
                class="flex justify-between gap-2 text-xs text-slate-600"
              >
                <span class="truncate">{{ item.label }}</span>
                <span class="shrink-0 font-medium">{{ formatCurrency(item.amount) }}</span>
              </li>
            </ul>

            <div class="mt-5 border-t border-slate-100 pt-4">
              <h3 class="text-xs font-bold uppercase tracking-wide text-slate-500">{{ t.excludedTitle }}</h3>
              <ul class="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                <li
                  v-for="(item, index) in metrics.excludedItems"
                  :key="`excluded-${index}`"
                  class="text-xs text-slate-600"
                >
                  <span class="mr-1 text-slate-400">•</span>
                  {{
                    item.reason === 'Opening balance row skipped'
                      ? t.openingSkipped
                      : item.reason === 'One-off purchase isolated'
                        ? t.macbookIsolated
                        : item.label
                  }}
                  <span class="text-slate-400">({{ formatCurrency(item.amount) }})</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <details class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <summary class="cursor-pointer px-5 py-4 text-sm font-semibold text-slate-800">
            {{ t.allTransactions }} <span class="font-normal text-slate-500">({{ metrics.transactions.length }})</span>
          </summary>
          <div class="overflow-x-auto border-t border-slate-100 px-5 py-4">
            <table class="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead class="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="border-b border-slate-200 px-3 py-2">{{ t.date }}</th>
                  <th class="border-b border-slate-200 px-3 py-2">{{ t.label }}</th>
                  <th class="border-b border-slate-200 px-3 py-2">{{ t.category }}</th>
                  <th class="border-b border-slate-200 px-3 py-2 text-right">{{ t.amount }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(transaction, index) in metrics.transactions" :key="`${transaction.date}-${index}`">
                  <td class="border-b border-slate-100 px-3 py-2 text-slate-500">{{ transaction.date }}</td>
                  <td class="max-w-md truncate border-b border-slate-100 px-3 py-2">{{ transaction.label }}</td>
                  <td class="border-b border-slate-100 px-3 py-2 text-slate-500">
                    {{ t.categories[transaction.category] }}
                  </td>
                  <td class="border-b border-slate-100 px-3 py-2 text-right font-medium" :class="transaction.amount < 0 ? 'text-rose-700' : 'text-emerald-700'">
                    {{ formatCurrency(transaction.amount) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>

        <FeedbackBar :lang="lang" :file-name="fileName" />
      </template>

      <p v-if="errorMessage" class="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">
        {{ errorMessage }}
      </p>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import CashProjectionChart from './components/CashProjectionChart.vue';
import FeedbackBar from './components/FeedbackBar.vue';
import ScenarioSandbox from './components/ScenarioSandbox.vue';
import SurvivalCards from './components/SurvivalCards.vue';
import { SAMPLE_CSV, parseBankCsv } from './utils/cashflowParser';
import { translations } from './utils/i18n';

const lang = ref(navigator.language?.toLowerCase().startsWith('fr') === false ? 'en' : 'fr');
const t = computed(() => translations[lang.value].mvp);
const appTitle = computed(() => translations[lang.value].appTitle);
watch(lang, (value) => {
  document.documentElement.lang = value;
}, { immediate: true });

const fileName = ref('');
const fileInput = ref(null);
const metrics = ref(null);
const originalCsv = ref('');
const openingInput = ref('');
const requiresOpeningBalance = ref(false);
const errorMessage = ref('');
const isDragging = ref(false);
const showRecurring = ref(false);
const scenarioState = ref([]);
let fileReadVersion = 0;
const scenarioBuffer = computed(() => {
  if (!metrics.value) return 0;
  return (
    metrics.value.safeToSpend +
    scenarioState.value
      .filter((scenario) => scenario.enabled)
      .filter((scenario) => scenario.type === 'monthly' || scenario.day <= 30)
      .reduce((sum, scenario) => sum + scenario.amount, 0)
  );
});

function formatCurrency(value) {
  return new Intl.NumberFormat(lang.value === 'fr' ? 'fr-FR' : 'en-IE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

function formatDate(value) {
  if (!value) return t.value.missingValue;
  return new Intl.DateTimeFormat(lang.value === 'fr' ? 'fr-FR' : 'en-IE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${value}T00:00:00Z`));
}

function recurringSummary(item) {
  const label = item.label.toUpperCase();
  if (label.includes('URSSAF')) return lang.value === 'fr' ? 'Cotisations sociales / URSSAF' : 'Social contributions / URSSAF';
  if (label.includes('REMUNERATION')) return lang.value === 'fr' ? 'Rémunération dirigeant' : 'Owner draw';
  if (label.includes('SOUS-TRAITANCE')) return lang.value === 'fr' ? 'Sous-traitant Studio K' : 'Subcontractor Studio K';
  return item.label.replace(/^(CB|PRLV SEPA|VIR SEPA|VIR INSTANTANE)\s*/i, '').trim();
}

function resetScenarios() {
  scenarioState.value = [
    { id: 'invoice', enabled: false, amount: metrics.value.expectedInvoice || 4800, type: 'oneOff', day: 26 },
    { id: 'bonus', enabled: true, amount: -3500, type: 'oneOff', day: 0 },
    { id: 'contractor', enabled: false, amount: -1200, type: 'monthly', day: 0 }
  ];
}

function loadCsvText(csvText, name) {
  try {
    const parsedMetrics = parseBankCsv(csvText);
    metrics.value = parsedMetrics;
    originalCsv.value = csvText;
    openingInput.value = '';
    requiresOpeningBalance.value = parsedMetrics.latestBalance === null;
    fileName.value = name;
    errorMessage.value = '';
    resetScenarios();
    showRecurring.value = false;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t.value.fileError;
  }
}

watch(openingInput, (value) => {
  if (!requiresOpeningBalance.value) return;
  const parsed = value === '' ? null : Number(value);
  if (parsed !== null && !Number.isFinite(parsed)) {
    errorMessage.value = t.value.fileError;
    return;
  }
  try {
    metrics.value = parseBankCsv(originalCsv.value, parsed);
    errorMessage.value = '';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t.value.fileError;
  }
});

function loadSample() {
  fileReadVersion += 1;
  loadCsvText(SAMPLE_CSV, 'freelance_cashflow_sample.csv');
}

function processFile(file) {
  if (!file) return;
  const version = ++fileReadVersion;
  if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
    errorMessage.value = t.value.fileError;
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    if (version !== fileReadVersion) return;
    if (typeof reader.result === 'string') loadCsvText(reader.result, file.name);
    else errorMessage.value = t.value.fileError;
  };
  reader.onerror = () => {
    if (version !== fileReadVersion) return;
    errorMessage.value = t.value.fileError;
  };
  reader.readAsText(file);
}

function handleFileUpload(event) {
  processFile(event.target.files?.[0]);
  event.target.value = '';
}

function handleDrop(event) {
  isDragging.value = false;
  processFile(event.dataTransfer?.files?.[0]);
}
</script>
