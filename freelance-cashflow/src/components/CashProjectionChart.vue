<template>
  <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-sm font-bold text-slate-900">{{ t.chartTitle }}</h3>
        <p class="mt-1 text-xs text-slate-500">{{ xLabels[0] }} → {{ xLabels[xLabels.length - 1] }}</p>
      </div>
      <div class="flex flex-wrap gap-3 text-xs">
        <span class="inline-flex items-center gap-1.5 text-slate-500">
          <span class="h-0.5 w-4 bg-slate-400" aria-hidden="true" />
          {{ t.baseline }}
        </span>
        <span class="inline-flex items-center gap-1.5 font-medium text-indigo-700">
          <span class="h-0.5 w-4 bg-indigo-600" aria-hidden="true" />
          {{ t.whatIf }}
        </span>
      </div>
    </div>

    <div class="mt-4">
      <svg class="h-auto w-full" viewBox="0 0 760 300" role="img" :aria-label="t.chartTitle">
        <defs>
          <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#64748b" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#64748b" stop-opacity="0.04" />
          </linearGradient>
        </defs>
        <g v-for="tick in yTicks" :key="tick.value">
          <line
            x1="62"
            :y1="tick.y"
            x2="738"
            :y2="tick.y"
            :stroke="tick.value === 0 ? '#64748b' : '#e2e8f0'"
            :stroke-dasharray="tick.value === 0 ? '4 3' : undefined"
            stroke-width="1"
          />
          <text x="54" :y="tick.y + 4" text-anchor="end" fill="#94a3b8" font-size="11">
            {{ formatShortCurrency(tick.value) }}
          </text>
        </g>

        <line v-for="day in monthGridDays" :key="`month-${day}`"
          :x1="xForDay(day)" :x2="xForDay(day)" :y1="plotTop" :y2="plotBottom"
          stroke="#cbd5e1" stroke-dasharray="3 4" stroke-width="1" />
        <polygon
          :points="baselineAreaPoints"
          :fill="`url(#${gradientId})`"
        />
        <line :x1="plotLeft" :x2="plotRight" :y1="yForValue(0)" :y2="yForValue(0)" stroke="#dc2626" stroke-dasharray="5 3" stroke-width="1.5" />
        <polyline
          :points="baselinePoints"
          fill="none"
          stroke="#475569"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <polyline
          :points="scenarioPoints"
          fill="none"
          stroke="#6d28d9"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="transition-all duration-500"
        />

        <g v-for="event in scenarioEvents" :key="event.id">
          <line
            :x1="xForDay(event.day)"
            y1="16"
            :x2="xForDay(event.day)"
            y2="244"
            stroke="#cbd5e1"
            stroke-width="1"
            stroke-dasharray="3 4"
          />
          <circle
            :cx="xForDay(event.day)"
            :cy="yForValue(scenarioSeries[event.day])"
            r="4"
            :fill="event.amount >= 0 ? '#10b981' : '#f97316'"
            stroke="white"
            stroke-width="2"
          />
        </g>

        <g v-for="(label, index) in xLabels" :key="`${label}-${index}`">
          <text
            :x="xForDay(tickDays[index])"
            y="268"
            :text-anchor="index === 0 ? 'start' : index === xLabels.length - 1 ? 'end' : 'middle'"
            fill="#64748b"
            font-size="11"
          >
            {{ label }}
          </text>
        </g>
        <text
          x="734"
          :y="Math.max(plotTop + 12, Math.min(plotBottom - 8, yForValue(scenarioSeries[90]) - 8))"
          text-anchor="end"
          fill="#4338ca"
          font-size="11"
          font-weight="700"
        >
          {{ formatShortCurrency(scenarioSeries[90]) }}
        </text>
      </svg>
    </div>

    <div class="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
      <span class="text-xs text-slate-500">{{ t.impact }}</span>
      <strong
        class="text-xs"
        :class="runwayDelta < 0 ? 'text-rose-700' : 'text-emerald-700'"
      >
        {{ runwayDelta > 0 ? '+' : '' }}{{ runwayDelta }} {{ t.daysShort }} ·
        {{ formatCurrency(scenarioSeries[90]) }} {{ t.januaryBalance }}
      </strong>
    </div>

    <div v-if="scenarioEvents.length" class="mt-3 flex flex-wrap gap-2">
      <span
        v-for="event in scenarioEvents"
        :key="`${event.id}-badge`"
        class="max-w-full truncate rounded-md bg-slate-50 px-2 py-1 text-[11px] text-slate-600"
      >
        {{ dateLabel(event.day) }} · {{ event.label }}:
        <strong :class="event.amount >= 0 ? 'text-emerald-700' : 'text-orange-700'">
          {{ formatCurrency(event.amount) }}
        </strong>
      </span>
    </div>
  </section>
</template>

<script setup>
import { computed, useId } from 'vue';
import { translations } from '../utils/i18n';

const props = defineProps({
  metrics: { type: Object, required: true },
  scenarios: { type: Array, required: true },
  lang: { type: String, default: 'fr' }
});

const t = computed(() => translations[props.lang].mvp);
const gradientId = `cash-gradient-${useId()}`;
const plotTop = 16;
const plotBottom = 244;
const plotLeft = 62;
const plotRight = 738;
const tickDays = [0, 15, 30, 45, 60, 75, 90];
const monthGridDays = computed(() => {
  const start = new Date(`${props.metrics.latestDate}T00:00:00Z`);
  const next = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  const result = [];
  while (next.getTime() <= start.getTime() + 90 * 86400000) {
    result.push(Math.round((next.getTime() - start.getTime()) / 86400000));
    next.setUTCMonth(next.getUTCMonth() + 1);
  }
  return result;
});
const days = Array.from({ length: 91 }, (_, index) => index);
const baselineSeries = computed(() => createSeries(false));
const scenarioEvents = computed(() =>
  [
    ...props.metrics.forecastEvents,
    ...props.scenarios
      .filter((scenario) => scenario.enabled && scenario.type !== 'monthly')
      .map((scenario) => ({
        ...scenario,
        day: Math.max(0, Math.min(90, scenario.day)),
        label:
          scenario.id === 'invoice'
            ? t.value.invoice
            : scenario.id === 'bonus'
              ? t.value.bonus
              : scenario.label
      }))
  ].sort((left, right) => left.day - right.day)
);
const scenarioSeries = computed(() => createSeries(true));
const bounds = computed(() => {
  const min = Math.min(0, ...baselineSeries.value, ...scenarioSeries.value);
  const max = Math.max(0, ...baselineSeries.value, ...scenarioSeries.value);
  const padding = Math.max(800, (max - min) * (0.15 / 0.7));
  return { min: min - padding, max: max + padding };
});
const minValue = computed(() => bounds.value.min);
const maxValue = computed(() => bounds.value.max);
const yTicks = computed(() =>
  Array.from({ length: 5 }, (_, index) => {
    const value = minValue.value + ((maxValue.value - minValue.value) / 4) * index;
    return { value, y: yForValue(value) };
  })
);
const baselinePoints = computed(() => toPoints(baselineSeries.value));
const scenarioPoints = computed(() => toPoints(scenarioSeries.value));
const baselineAreaPoints = computed(
  () => `${plotLeft},${plotBottom} ${baselinePoints.value} ${plotRight},${plotBottom}`
);
const runwayDelta = computed(() => {
  const baselineCash = Math.max(0, props.metrics.latestBalance);
  const baselineBurn = Math.max(1, props.metrics.recurringBurn);
  const activeOneOffs = props.scenarios
    .filter((scenario) => scenario.enabled && scenario.type !== 'monthly')
    .filter((scenario) => scenario.day <= 90)
    .reduce((sum, scenario) => sum + scenario.amount, 0);
  const addedMonthlyBurn = props.scenarios
    .filter((scenario) => scenario.enabled && scenario.type === 'monthly')
    .reduce((sum, scenario) => sum + Math.abs(scenario.amount), 0);
  const scenarioDays = Math.max(
    0,
    Math.round(((baselineCash + activeOneOffs) / (baselineBurn + addedMonthlyBurn)) * 30)
  );
  return scenarioDays - props.metrics.runwayDays;
});
const xLabels = computed(() =>
  tickDays.map((day) => {
    const date = new Date(`${props.metrics.latestDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + day);
    return new Intl.DateTimeFormat(props.lang === 'fr' ? 'fr-FR' : 'en-IE', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    }).format(date);
  })
);

function createSeries(applyScenarios) {
  return days.map((day) => {
    const recurring = (props.metrics.recurringBurn / 30) * day;
    const taxOutflow = props.metrics.forecastEvents
      .filter((event) => event.day <= day)
      .reduce((sum, event) => sum + event.amount, 0);
    let scenarioOutflow = 0;

    if (applyScenarios) {
      scenarioOutflow += props.scenarios
        .filter(
          (scenario) =>
            scenario.enabled &&
            scenario.type !== 'monthly' &&
            scenario.day <= day
        )
        .reduce((sum, scenario) => sum + scenario.amount, 0);
      scenarioOutflow += props.scenarios
        .filter(
          (scenario) =>
            scenario.enabled &&
            scenario.type === 'monthly' &&
            scenario.day < day
        )
        .reduce(
          (sum, scenario) =>
            sum + scenario.amount * ((day - scenario.day) / 30),
          0
        );
    }

    return props.metrics.latestBalance - recurring + taxOutflow + scenarioOutflow;
  });
}

function xForDay(day) {
  return plotLeft + (day / 90) * (plotRight - plotLeft);
}

function yForValue(value) {
  const range = maxValue.value - minValue.value || 1;
  return plotBottom - ((value - minValue.value) / range) * (plotBottom - plotTop);
}

function toPoints(series) {
  return series.map((value, day) => `${xForDay(day)},${yForValue(value)}`).join(' ');
}

function dateLabel(day) {
  const date = new Date(`${props.metrics.latestDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + day);
  return new Intl.DateTimeFormat(props.lang === 'fr' ? 'fr-FR' : 'en-IE', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

function formatCurrency(value) {
  return new Intl.NumberFormat(props.lang === 'fr' ? 'fr-FR' : 'en-IE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

function formatShortCurrency(value) {
  const rounded = Math.round(value);
  return `${rounded < 0 ? '−' : ''}€${Math.abs(rounded).toLocaleString(
    props.lang === 'fr' ? 'fr-FR' : 'en-IE'
  )}`;
}
</script>
