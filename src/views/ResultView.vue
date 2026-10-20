<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'

const router = useRouter()
const quiz = useQuizStore()

const percent = computed(() => Math.round(quiz.score.ratio * 100))

const wrongItems = computed(() =>
  quiz.wrongAnswers.flatMap((answer) => {
    const question = quiz.questions.find((q) => q.id === answer.questionId)
    if (!question) return []
    return [
      {
        question,
        chosen: question.options.filter((o) => answer.selected.includes(o.id)),
        correct: question.options.filter((o) => o.correct),
      },
    ]
  }),
)

function repeatWrong() {
  quiz.repeatWrong()
  router.push({ name: 'quiz' })
}

function restart() {
  const categoryId = quiz.info?.categoryId
  if (categoryId === undefined) return
  quiz.startCategory(categoryId)
  router.push({ name: 'quiz' })
}
</script>

<template>
  <section class="result">
    <h1>Ergebnis</h1>
    <p class="result__title">{{ quiz.info?.title }}</p>
    <p class="result__score">
      <strong>{{ quiz.score.correct }} von {{ quiz.score.total }}</strong> richtig ({{ percent }} %)
    </p>

    <div class="result__actions">
      <button v-if="wrongItems.length > 0" type="button" class="btn" @click="repeatWrong">
        Falsche Fragen wiederholen
      </button>
      <button
        v-if="quiz.info?.categoryId !== undefined"
        type="button"
        class="btn btn--secondary"
        @click="restart"
      >
        Kategorie neu starten
      </button>
      <RouterLink :to="{ name: 'categories' }" class="btn btn--secondary">
        Andere Kategorie
      </RouterLink>
    </div>

    <section v-if="wrongItems.length > 0" aria-labelledby="wrong-heading">
      <h2 id="wrong-heading">Falsch beantwortet ({{ wrongItems.length }})</h2>
      <ol class="wrong">
        <li v-for="item in wrongItems" :key="item.question.id" class="wrong__item">
          <p class="wrong__question">
            <span class="wrong__number">Frage {{ item.question.number }}:</span>
            {{ item.question.question }}
          </p>
          <p class="wrong__label">Deine Auswahl:</p>
          <ul class="wrong__options">
            <li v-for="option in item.chosen" :key="option.id">
              <span aria-hidden="true">{{ option.correct ? '✓' : '✗' }}</span>
              <span class="visually-hidden">{{ option.correct ? 'richtig:' : 'falsch:' }}</span>
              {{ option.text }}
            </li>
          </ul>
          <p class="wrong__label">Richtig:</p>
          <ul class="wrong__options wrong__options--correct">
            <li v-for="option in item.correct" :key="option.id">
              <span aria-hidden="true">✓</span> {{ option.text }}
            </li>
          </ul>
        </li>
      </ol>
    </section>
    <p v-else class="result__perfect">Alle Fragen richtig beantwortet.</p>
  </section>
</template>

<style scoped>
.result__title {
  margin: 0;
  color: var(--color-text-muted);
}

.result__score {
  font-size: 1.5rem;
  margin: var(--space-3) 0 var(--space-6);
}

.result__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.result__actions > * {
  flex: 1 1 12rem;
}

.wrong {
  display: grid;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.wrong__item {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}

.wrong__question {
  margin: 0 0 var(--space-3);
  font-weight: 600;
}

.wrong__number {
  color: var(--color-text-muted);
}

.wrong__label {
  margin: var(--space-2) 0 var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.wrong__options {
  margin: 0;
  padding-left: var(--space-4);
  list-style: none;
}

.wrong__options--correct {
  color: var(--color-success);
}
</style>
