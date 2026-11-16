<template>
  <aside class="fixed bottom-4 right-4 z-40 w-[min(24rem,calc(100vw-2rem))]" :aria-label="t.feedbackToggle">
    <button
      v-if="!expanded"
      type="button"
      class="ml-auto block rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg hover:bg-slate-50"
      :aria-expanded="expanded"
      aria-controls="feedback-panel"
      @click="expanded = true"
    >
      {{ t.feedbackToggle }}
    </button>
    <div v-else id="feedback-panel" class="max-h-[80vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-bold text-slate-900">{{ t.challengeTitle }}</p>
          <p class="mt-1 text-xs text-slate-600">{{ t.challengeHint }}</p>
        </div>
        <div class="flex shrink-0 gap-1">
          <button type="button" class="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100" :aria-label="t.feedbackCollapse" @click="expanded = false">−</button>
          <button type="button" class="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100" :aria-label="t.close" @click="emit('close')">✕</button>
        </div>
      </div>

      <template v-if="!submitted">
        <form class="mt-4 grid gap-4" @submit.prevent="submitFeedback">
          <fieldset>
            <legend id="feedback-title" class="text-sm font-semibold">{{ t.question }}</legend>
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="(option, index) in t.timeOptions"
                :key="index"
                type="button"
                class="rounded-lg border px-3 py-2 text-xs font-medium transition"
                :class="selectedTime === index ? 'border-indigo-700 bg-indigo-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
                :aria-pressed="selectedTime === index"
                @click="selectedTime = index"
              >
                {{ option }}
              </button>
            </div>
          </fieldset>

          <div class="flex flex-col gap-2">
            <label class="sr-only" for="feedback-email">{{ t.emailLabel }}</label>
            <input
              id="feedback-email"
              v-model.trim="email"
              type="email"
              autocomplete="email"
              :placeholder="t.emailPlaceholder"
              class="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-600 focus:outline-none"
            />
            <button
              type="submit"
              :disabled="selectedTime === null"
              class="shrink-0 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ t.submitFeedback }}
            </button>
          </div>
        </form>
        <p v-if="errorMessage" class="mt-2 text-xs text-rose-700" role="alert">{{ errorMessage }}</p>
        <p class="mt-3 text-[11px] text-slate-600">{{ t.privacy }}</p>
      </template>

      <p v-else class="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800" role="status">
        {{ t.feedbackSaved }}
      </p>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue';
import { translations } from '../utils/i18n';

const props = defineProps({
  lang: { type: String, default: 'fr' }
});

const emit = defineEmits(['close']);
const t = computed(() => translations[props.lang].mvp);
const selectedTime = ref(null);
const expanded = ref(false);
const email = ref('');
const submitted = ref(false);
const errorMessage = ref('');

function submitFeedback() {
  if (selectedTime.value === null) return;

  const payload = {
    timestamp: new Date().toISOString(),
    lang: props.lang,
    timeToAnswer: t.value.timeOptions[selectedTime.value],
    email: email.value
  };

  try {
    const stored = JSON.parse(localStorage.getItem('cashpilot_feedback') || '[]');
    if (!Array.isArray(stored)) throw new Error('Invalid feedback storage');
    stored.push(payload);
    localStorage.setItem('cashpilot_feedback', JSON.stringify(stored));
    submitted.value = true;
    errorMessage.value = '';
  } catch {
    errorMessage.value = t.value.feedbackError;
  }
}
</script>
