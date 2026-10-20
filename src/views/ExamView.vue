<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import ProgressBar from '@/components/ProgressBar.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import { formatDuration, remainingSeconds } from '@/lib/exam'
import { useExamStore } from '@/stores/exam'

const WARNING_SECONDS = 5 * 60

const router = useRouter()
const exam = useExamStore()

const view = ref<'question' | 'overview'>('question')
const now = ref(Date.now())
let interval: ReturnType<typeof setInterval> | undefined

const remaining = computed(() =>
  exam.deadline === null ? null : remainingSeconds(exam.deadline, now.value),
)
const isLast = computed(() => exam.currentIndex === exam.total - 1)

function finish(timedOut = false) {
  exam.submit({ timedOut })
  router.push({ name: 'exam-result' })
}

function tick() {
  now.value = Date.now()
  if (exam.inProgress && exam.deadline !== null && now.value >= exam.deadline) finish(true)
}

onMounted(() => {
  tick()
  interval = setInterval(tick, 1000)
})
onUnmounted(() => clearInterval(interval))

onBeforeRouteLeave(() => {
  if (!exam.inProgress) return true
  if (!window.confirm('Prüfung abbrechen? Deine Antworten werden nicht gewertet.')) return false
  exam.abort()
  return true
})

function nextOrOverview() {
  if (isLast.value) view.value = 'overview'
  else exam.next()
}

function showQuestion(index: number) {
  exam.goTo(index)
  view.value = 'question'
}

function submit() {
  const message =
    exam.unansweredCount > 0
      ? `Noch ${exam.unansweredCount} ${exam.unansweredCount === 1 ? 'Frage ist' : 'Fragen sind'} unbeantwortet. Trotzdem abgeben?`
      : 'Prüfung jetzt abgeben?'
  if (window.confirm(message)) finish()
}

function statusLabel(questionId: string): string {
  const parts = [exam.statusOf(questionId) === 'answered' ? 'beantwortet' : 'offen']
  if (exam.isFlagged(questionId)) parts.push('markiert')
  return parts.join(', ')
}
</script>

<template>
  <section v-if="exam.currentQuestion" class="exam">
    <header class="exam__header">
      <div class="exam__meta">
        <p class="exam__title">Prüfungssimulation</p>
        <p
          v-if="remaining !== null"
          class="exam__timer"
          :class="{ 'exam__timer--warning': remaining <= WARNING_SECONDS }"
          role="timer"
          aria-label="Verbleibende Zeit"
        >
          <span aria-hidden="true">⏱</span> {{ formatDuration(remaining) }}
        </p>
      </div>
      <p class="exam__position">
        <template v-if="view === 'question'">
          Frage {{ exam.currentIndex + 1 }} von {{ exam.total }} ·
        </template>
        {{ exam.answeredCount }} beantwortet
      </p>
      <ProgressBar :value="exam.answeredCount" :max="exam.total" label="Beantwortete Fragen" />
    </header>

    <template v-if="view === 'question'">
      <QuestionCard
        :key="exam.currentQuestion.id"
        :question="exam.currentQuestion"
        :options="exam.currentOptions"
        :selected="exam.currentSelection"
        :feedback="null"
        @toggle="exam.toggleOption"
      />

      <button
        type="button"
        class="exam__flag"
        :aria-pressed="exam.isCurrentFlagged"
        @click="exam.toggleFlag"
      >
        <span aria-hidden="true">⚑</span>
        {{ exam.isCurrentFlagged ? 'Markiert zum späteren Ansehen' : 'Später ansehen' }}
      </button>

      <div class="exam__nav">
        <button
          type="button"
          class="btn btn--secondary"
          :disabled="exam.currentIndex === 0"
          @click="exam.previous"
        >
          Zurück
        </button>
        <button type="button" class="btn" @click="nextOrOverview">
          {{ isLast ? 'Zur Übersicht' : 'Weiter' }}
        </button>
      </div>
      <button type="button" class="btn btn--secondary btn--block" @click="view = 'overview'">
        Übersicht &amp; Abgabe
      </button>
    </template>

    <section v-else aria-labelledby="overview-heading" class="overview">
      <h2 id="overview-heading">Übersicht</h2>
      <p>
        {{ exam.answeredCount }} von {{ exam.total }} beantwortet ·
        {{ exam.flagged.length }} markiert
      </p>
      <p class="overview__legend">
        <span><span aria-hidden="true">✓</span> beantwortet</span>
        <span><span aria-hidden="true">–</span> offen</span>
        <span><span aria-hidden="true">⚑</span> markiert</span>
      </p>
      <ol class="overview__grid">
        <li v-for="(question, index) in exam.questions" :key="question.id">
          <button
            type="button"
            class="overview__item"
            :class="{
              'overview__item--answered': exam.statusOf(question.id) === 'answered',
              'overview__item--flagged': exam.isFlagged(question.id),
            }"
            :aria-label="`Frage ${index + 1}: ${statusLabel(question.id)}`"
            @click="showQuestion(index)"
          >
            <span class="overview__number">{{ index + 1 }}</span>
            <span class="overview__status" aria-hidden="true">
              {{ exam.statusOf(question.id) === 'answered' ? '✓' : '–'
              }}{{ exam.isFlagged(question.id) ? ' ⚑' : '' }}
            </span>
          </button>
        </li>
      </ol>
      <div class="exam__nav">
        <button type="button" class="btn btn--secondary" @click="view = 'question'">
          Zurück zu den Fragen
        </button>
        <button type="button" class="btn" @click="submit">Prüfung abgeben</button>
      </div>
    </section>

    <RouterLink :to="{ name: 'home' }" class="exam__abort">Prüfung abbrechen</RouterLink>
  </section>
</template>

<style scoped>
.exam__header {
  margin-bottom: var(--space-6);
}

.exam__meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-3);
}

.exam__title {
  margin: 0;
  font-weight: 600;
}

.exam__timer {
  margin: 0;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.exam__timer--warning {
  color: var(--color-error);
}

.exam__position {
  margin: 0 0 var(--space-2);
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.exam__flag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 2.75rem;
  margin: var(--space-4) 0;
  padding: var(--space-2) var(--space-3);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.exam__flag[aria-pressed='true'] {
  border-style: solid;
  border-color: var(--color-missed);
  background: var(--color-missed-bg);
  color: var(--color-missed);
  font-weight: 600;
}

.exam__nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.exam__abort {
  display: inline-block;
  margin-top: var(--space-6);
  font-size: 0.875rem;
}

.overview h2 {
  font-size: 1.125rem;
}

.overview__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.overview__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(3.5rem, 1fr));
  gap: var(--space-2);
  margin: 0 0 var(--space-6);
  padding: 0;
  list-style: none;
}

.overview__item {
  display: grid;
  justify-items: center;
  width: 100%;
  min-height: 3.25rem;
  padding: var(--space-1);
  border: 2px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.overview__item--answered {
  border-color: var(--color-primary);
}

.overview__item--flagged {
  border-color: var(--color-missed);
  background: var(--color-missed-bg);
}

.overview__number {
  font-weight: 700;
}

.overview__status {
  font-size: 0.75rem;
}
</style>
