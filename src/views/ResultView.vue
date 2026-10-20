<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import WrongAnswerList from '@/components/WrongAnswerList.vue'
import { useProgressStore } from '@/stores/progress'
import { useQuizStore } from '@/stores/quiz'

const router = useRouter()
const quiz = useQuizStore()
const progress = useProgressStore()

const percent = computed(() => Math.round(quiz.score.ratio * 100))

const wrongItems = computed(() =>
  quiz.wrongAnswers.flatMap((answer) => {
    const question = quiz.questions.find((q) => q.id === answer.questionId)
    return question ? [{ question, selected: answer.selected }] : []
  }),
)

function repeatWrong() {
  quiz.repeatWrong()
  router.push({ name: 'quiz' })
}

const restartLabel = computed(() => {
  switch (quiz.info?.mode) {
    case 'category':
      return 'Kategorie neu starten'
    case 'random':
      return 'Neue Zufallsrunde'
    case 'mistakes':
      return progress.wrongIds.length > 0 ? 'Verbleibende Fehler wiederholen' : null
    default:
      return null
  }
})

function restart() {
  if (quiz.restart()) router.push({ name: 'quiz' })
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
      <button v-if="restartLabel" type="button" class="btn btn--secondary" @click="restart">
        {{ restartLabel }}
      </button>
      <RouterLink
        v-if="quiz.info?.mode === 'category'"
        :to="{ name: 'categories' }"
        class="btn btn--secondary"
      >
        Andere Kategorie
      </RouterLink>
      <RouterLink v-else :to="{ name: 'home' }" class="btn btn--secondary">
        Zur Startseite
      </RouterLink>
    </div>

    <section v-if="wrongItems.length > 0" aria-labelledby="wrong-heading">
      <h2 id="wrong-heading">Falsch beantwortet ({{ wrongItems.length }})</h2>
      <WrongAnswerList :items="wrongItems" />
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
</style>
