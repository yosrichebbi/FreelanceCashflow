<template>
  <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-sm font-bold text-slate-900">{{ t.quickSimulator }}</h3>
        <p class="mt-1 text-xs text-slate-500">{{ t.sandboxSubtitle }}</p>
      </div>
      <span class="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-bold tracking-wide text-indigo-700">
        1-CLICK
      </span>
    </div>

    <p
      class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"
      aria-live="polite"
    >
      {{ t.decisionResult }}
      <strong class="text-base" :class="scenarioBuffer < 0 ? 'text-rose-700' : 'text-slate-900'">
        {{ formatCurrency(scenarioBuffer) }}
      </strong>.
    </p>

    <div class="mt-4 divide-y divide-slate-100">
      <div
        v-for="scenario in modelValue"
        :key="scenario.id"
        class="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              :class="scenario.enabled ? (scenario.amount < 0 ? 'bg-rose-700' : 'bg-emerald-700') : 'bg-slate-300'"
              :aria-checked="scenario.enabled"
              :aria-label="scenarioTitle(scenario)"
              @click="toggle(scenario.id)"
            >
              <span
                class="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform"
                :class="scenario.enabled ? 'translate-x-5' : 'translate-x-0.5'"
              />
            </button>
            <span class="text-sm font-semibold text-slate-800">{{ scenarioTitle(scenario) }}</span>
          </div>
          <div class="ml-[3.75rem] mt-1 flex flex-wrap items-center gap-2">
            <span class="text-xs text-slate-500">{{ scenarioDescription(scenario) }}</span>
            <label
              v-if="scenario.type !== 'monthly'"
              class="flex items-center gap-1 text-[11px] text-slate-500"
            >
              {{ t.timing }}
              <select
                :value="scenario.day"
                class="rounded border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-700"
                :aria-label="`${scenarioTitle(scenario)} — ${t.timing}`"
                @change="setDay(scenario.id, Number($event.target.value))"
              >
                <option v-for="option in timingOptions" :key="option.day" :value="option.day">
                  {{ option.label }}
                </option>
              </select>
            </label>
          </div>
        </div>
        <span
          class="shrink-0 whitespace-nowrap text-sm font-bold"
          :class="scenario.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'"
        >
          {{ scenario.amount > 0 ? '+' : '−' }}{{ formatCurrency(Math.abs(scenario.amount)) }}
          <span v-if="scenario.type === 'monthly'" class="text-[11px] font-medium text-slate-500">{{ t.burnMonth }}</span>
        </span>
      </div>
    </div>

    <form class="mt-4 border-t border-slate-100 pt-4" @submit.prevent="addCustomScenario">
      <p class="mb-2 text-xs font-semibold text-slate-700">{{ t.addScenario }}</p>
      <div class="flex flex-col gap-2">
        <input
          v-model.trim="customName"
          type="text"
          required
          maxlength="60"
          :placeholder="t.customName"
          :aria-label="t.customName"
          class="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
        />
        <div class="flex flex-wrap items-stretch gap-2">
          <fieldset class="inline-flex rounded-lg border border-slate-300 p-0.5">
            <legend class="sr-only">{{ t.amountDirection }}</legend>
            <label
              v-for="direction in ['income', 'expense']"
              :key="direction"
              class="cursor-pointer rounded-md px-2 py-1.5 text-xs font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600"
              :class="customDirection === direction ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'"
            >
              <input v-model="customDirection" class="sr-only" type="radio" name="custom-direction" :value="direction" />
              {{ direction === 'income' ? t.moneyIn : t.moneyOut }}
            </label>
          </fieldset>
          <input
            v-model.number="customAmount"
            type="number"
            min="0.01"
            step="0.01"
            required
            :placeholder="t.positiveAmount"
            :aria-label="t.positiveAmount"
            class="min-w-24 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            class="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            + {{ t.add }}
          </button>
        </div>
        <p v-if="customError" class="mt-2 text-xs text-rose-700" role="alert">{{ t.customError }}</p>
      </div>
    </form>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { translations } from '../utils/i18n';

const props = defineProps({
  modelValue: { type: Array, required: true },
  metrics: { type: Object, required: true },
  scenarioBuffer: { type: Number, required: true },
  lang: { type: String, default: 'fr' }
});

const emit = defineEmits(['update:modelValue']);
const t = computed(() => translations[props.lang].mvp);
const customName = ref('');
const customAmount = ref(null);
const customDirection = ref('expense');
const customError = ref(false);
let nextCustomId = 0;
const timingOptions = computed(() =>
  [0, 26, 56, 90].map((day) => ({
    day,
    label:
      day === 0
        ? t.value.today
        : new Intl.DateTimeFormat(props.lang === 'fr' ? 'fr-FR' : 'en-IE', {
            day: 'numeric',
            month: 'short',
            timeZone: 'UTC'
          }).format(new Date(new Date(`${props.metrics.latestDate}T00:00:00Z`).getTime() + day * 86400000))
  }))
);

function scenarioTitle(scenario) {
  if (scenario.id === 'invoice') return t.value.invoice;
  if (scenario.id === 'bonus') return t.value.bonus;
  if (scenario.id === 'contractor') return t.value.contractor;
  return scenario.label;
}

function scenarioDescription(scenario) {
  if (scenario.id === 'invoice') return t.value.invoiceHint;
  if (scenario.id === 'bonus') return t.value.bonusHint;
  if (scenario.id === 'contractor') return t.value.contractorHint;
  return t.value.customScenario;
}

function updateScenario(id, updates) {
  emit(
    'update:modelValue',
    props.modelValue.map((scenario) =>
      scenario.id === id ? { ...scenario, ...updates } : scenario
    )
  );
}

function toggle(id) {
  const current = props.modelValue.find((scenario) => scenario.id === id);
  if (current) updateScenario(id, { enabled: !current.enabled });
}

function setDay(id, day) {
  updateScenario(id, { day });
}

function addCustomScenario() {
  const name = customName.value.trim();
  const amount = Number(customAmount.value);
  if (!name || !Number.isFinite(amount) || amount <= 0) {
    customError.value = true;
    return;
  }
  customError.value = false;

  emit('update:modelValue', [
    ...props.modelValue,
    {
      id: `custom-${Date.now()}-${nextCustomId++}`,
      label: name,
      enabled: true,
      amount: customDirection.value === 'expense' ? -amount : amount,
      type: 'oneOff',
      day: 0
    }
  ]);
  customName.value = '';
  customAmount.value = null;
}

function formatCurrency(value) {
  return new Intl.NumberFormat(props.lang === 'fr' ? 'fr-FR' : 'en-IE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}
</script>
