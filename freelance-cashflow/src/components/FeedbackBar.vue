<template>
  <aside
    class="pointer-events-none fixed bottom-4 right-4 z-40 w-[min(24rem,calc(100vw-2rem))]"
    :aria-label="t.feedbackToggle"
    @keydown.esc.stop="expanded = false"
  >
    <div class="flex flex-col items-end gap-2">
      <section
        id="feedback-panel"
        v-show="expanded"
        class="pointer-events-auto max-h-[min(80dvh,36rem)] w-full overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl"
        aria-labelledby="feedback-title"
      >
        <div class="flex items-start gap-3">
          <div>
            <h2 id="feedback-title" class="text-sm font-bold text-slate-900">{{ t.challengeTitle }}</h2>
            <p class="mt-1 text-xs text-slate-600">{{ t.challengeHint }}</p>
          </div>
        </div>

        <template v-if="!submitted">
          <form class="mt-4 grid gap-4" @submit.prevent="submitFeedback">
            <fieldset>
              <legend class="text-sm font-semibold">{{ t.question }}</legend>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="(option, index) in t.timeOptions"
                  :key="index"
                  type="button"
                  class="rounded-lg border px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                  :class="selectedTime === index ? 'border-indigo-700 bg-indigo-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
                  :aria-pressed="selectedTime === index"
                  @click="selectedTime = index"
                >
                  {{ option }}
                </button>
              </div>
            </fieldset>

            <fieldset>
              <legend class="text-sm font-semibold">{{ t.confidenceQuestion }}</legend>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="(option, index) in t.confidenceOptions"
                  :key="index"
                  type="button"
                  class="h-10 w-10 rounded-lg border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                  :class="confidenceScore === index + 1 ? 'border-indigo-700 bg-indigo-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
                  :aria-label="option"
                  :aria-pressed="confidenceScore === index + 1"
                  @click="confidenceScore = index + 1"
                >
                  {{ index + 1 }}
                </button>
              </div>
              <div class="mt-1 flex justify-between text-[11px] text-slate-500">
                <span>{{ t.confidenceLow }}</span>
                <span>{{ t.confidenceHigh }}</span>
              </div>
            </fieldset>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-medium text-slate-700" for="feedback-comment">{{ t.commentLabel }}</label>
              <textarea
                id="feedback-comment"
                v-model.trim="comment"
                rows="3"
                :placeholder="t.commentPlaceholder"
                class="min-w-0 resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              />
              <button
                type="submit"
                :disabled="selectedTime === null || confidenceScore === null || isSubmitting"
                class="shrink-0 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ isSubmitting ? t.feedbackSending : t.submitFeedback }}
              </button>
            </div>
          </form>
          <p v-if="errorMessage" class="mt-2 text-xs text-rose-700" role="alert">{{ errorMessage }}</p>
          <p class="mt-3 text-[11px] text-slate-600">{{ t.privacy }}</p>
        </template>

        <p v-else class="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800" role="status">
          {{ t.feedbackSaved }}
        </p>
      </section>

      <button
        type="button"
        class="pointer-events-auto rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        :aria-expanded="expanded"
        aria-controls="feedback-panel"
        @click="expanded = !expanded"
      >
        {{ expanded ? t.feedbackCollapse : t.feedbackToggle }}
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, shallowRef } from 'vue';
import { translations } from '../utils/i18n';

const props = defineProps({
  lang: { type: String, default: 'fr' },
  fileName: { type: String, required: true }
});

const t = computed(() => translations[props.lang].mvp);
const selectedTime = shallowRef(null);
const confidenceScore = shallowRef(null);
const expanded = shallowRef(false);
const comment = shallowRef('');
const submitted = shallowRef(false);
const isSubmitting = shallowRef(false);
const errorMessage = shallowRef('');

async function submitFeedback() {
  if (selectedTime.value === null || confidenceScore.value === null || isSubmitting.value) return;

  const payload = {
    timestamp: new Date().toISOString(),
    lang: props.lang,
    fileName: props.fileName,
    timeToAnswerSec: [150, 1350, 3600][selectedTime.value],
    confidenceScore: confidenceScore.value,
    comment: comment.value
  };

  isSubmitting.value = true;
  errorMessage.value = '';
  try {
    await handleFeedbackSubmit(payload);
    submitted.value = true;
  } catch {
    errorMessage.value = t.value.feedbackError;
  } finally {
    isSubmitting.value = false;
  }
}

async function handleFeedbackSubmit(payload) {
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz9Za9saCOJfbjil5d1ifWH_utfhZVBnmL30rPtb7oYPYhbTykVvWNLMY84OuR8FLmFeA/exec';

  await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
}
</script>
