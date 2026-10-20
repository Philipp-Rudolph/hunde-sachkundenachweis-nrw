<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import ProgressBar from '@/components/ProgressBar.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import { useQuizKeyboard } from '@/composables/useQuizKeyboard'
import { useQuizStore } from '@/stores/quiz'

const router = useRouter()
const quiz = useQuizStore()

const answeredCount = computed(() => quiz.currentIndex + (quiz.isChecked ? 1 : 0))

const resultMessage = computed(() => {
  if (!quiz.isChecked || !quiz.feedback) return ''
  if (quiz.currentAnswer?.correct) return 'Richtig!'
  const correctLabels = quiz.currentOptions.filter((o) => o.correct).map((o) => o.label)
  return `Leider falsch. Richtig ${correctLabels.length > 1 ? 'sind' : 'ist'}: ${correctLabels.join(', ')}`
})
const answerCorrect = computed(() => quiz.currentAnswer?.correct ?? false)
const primaryLabel = computed(() => {
  if (!quiz.isChecked) return 'Prüfen'
  return quiz.isLast ? 'Zum Ergebnis' : 'Weiter'
})

const card = useTemplateRef<InstanceType<typeof QuestionCard>>('card')

// Prüfen and Weiter share one button, so focus stays put after checking.
function primaryAction() {
  if (quiz.isChecked) quiz.next()
  else quiz.check()
}

useQuizKeyboard({
  onPrimary: primaryAction,
  onToggleLabel: (label) => {
    const option = quiz.currentOptions.find((o) => o.label === label)
    if (option) quiz.toggleOption(option.id)
  },
})

watch(
  () => quiz.currentQuestion?.id,
  async (id, previousId) => {
    if (!id || !previousId) return
    await nextTick()
    card.value?.focusHeading()
  },
)

watch(
  () => quiz.finished,
  (finished) => {
    if (finished) router.push({ name: 'result' })
  },
)
</script>

<template>
  <section v-if="quiz.currentQuestion" class="quiz">
    <header class="quiz__header">
      <h1 class="quiz__title">{{ quiz.info?.title }}</h1>
      <p class="quiz__position">Frage {{ quiz.currentIndex + 1 }} von {{ quiz.total }}</p>
      <ProgressBar :value="answeredCount" :max="quiz.total" label="Fortschritt in dieser Runde" />
    </header>

    <QuestionCard
      ref="card"
      :key="quiz.currentQuestion.id"
      :question="quiz.currentQuestion"
      :options="quiz.currentOptions"
      :selected="quiz.selection"
      :feedback="quiz.feedback"
      @toggle="quiz.toggleOption"
    />

    <p
      class="quiz__result"
      :class="resultMessage && (answerCorrect ? 'quiz__result--correct' : 'quiz__result--wrong')"
      aria-live="polite"
    >
      <template v-if="resultMessage">
        <span aria-hidden="true">{{ answerCorrect ? '✓' : '✗' }}</span> {{ resultMessage }}
      </template>
    </p>

    <div class="quiz__actions">
      <button
        type="button"
        class="btn btn--block"
        :disabled="!quiz.isChecked && !quiz.canCheck"
        @click="primaryAction"
      >
        {{ primaryLabel }}
      </button>
      <RouterLink
        :to="{ name: quiz.info?.mode === 'category' ? 'categories' : 'home' }"
        class="btn btn--secondary btn--block"
      >
        Abbrechen
      </RouterLink>
    </div>
    <p class="keyboard-hint">Tastatur: A–D wählt Antworten, Enter prüft bzw. geht weiter.</p>
  </section>
</template>

<style scoped>
.quiz__header {
  margin-bottom: var(--space-6);
}

.quiz__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.quiz__position {
  margin: 0 0 var(--space-2);
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.quiz__result {
  min-height: 1.5rem;
  margin: var(--space-4) 0;
  font-weight: 600;
}

.quiz__result--correct {
  color: var(--color-success);
}

.quiz__result--wrong {
  color: var(--color-error);
}

.quiz__actions {
  display: grid;
  gap: var(--space-3);
}
</style>
