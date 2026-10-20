<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import WrongAnswerList from '@/components/WrongAnswerList.vue'
import { categories } from '@/data'
import { useExamStore } from '@/stores/exam'

const router = useRouter()
const exam = useExamStore()

const result = computed(() => exam.result)
const percent = computed(() => Math.round((result.value?.ratio ?? 0) * 100))

const categoryRows = computed(() =>
  (result.value?.byCategory ?? []).map((row) => ({
    ...row,
    name: categories.find((c) => c.id === row.categoryId)?.name ?? `Kategorie ${row.categoryId}`,
  })),
)

const wrongItems = computed(() =>
  (result.value?.questions ?? []).flatMap((r) => {
    if (r.correct) return []
    const question = exam.questions.find((q) => q.id === r.questionId)
    return question ? [{ question, selected: r.selected }] : []
  }),
)

function startNew() {
  exam.start()
  router.push({ name: 'exam' })
}
</script>

<template>
  <section v-if="result" class="exam-result">
    <h1>Prüfungsergebnis</h1>

    <p class="verdict" :class="result.passed ? 'verdict--passed' : 'verdict--failed'">
      <span aria-hidden="true">{{ result.passed ? '✓' : '✗' }}</span>
      {{ result.passed ? 'Bestanden' : 'Nicht bestanden' }}
    </p>
    <p class="score">
      <strong>{{ result.correct }} von {{ result.total }}</strong> richtig ({{ percent }} %)
    </p>
    <p class="details">
      Bestanden ab {{ exam.config.passMinCorrect }} von {{ result.total }} richtigen Antworten.
      <template v-if="result.unanswered > 0">
        {{ result.unanswered }}
        {{ result.unanswered === 1 ? 'Frage blieb' : 'Fragen blieben' }} unbeantwortet und
        {{ result.unanswered === 1 ? 'zählt' : 'zählen' }} als falsch.
      </template>
    </p>
    <p v-if="exam.timedOut" class="details details--timeout">
      Die Zeit ist abgelaufen. Die Prüfung wurde automatisch abgegeben.
    </p>
    <p v-if="exam.deadline !== null" class="note">
      Hinweis: Das Zeitlimit ist ein vorläufiger Übungswert.
    </p>

    <div class="actions">
      <button type="button" class="btn" @click="startNew">Neue Prüfung</button>
      <RouterLink :to="{ name: 'home' }" class="btn btn--secondary">Zur Startseite</RouterLink>
    </div>

    <h2>Auswertung nach Kategorie</h2>
    <table class="categories">
      <thead>
        <tr>
          <th scope="col">Kategorie</th>
          <th scope="col" class="num">Richtig</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in categoryRows" :key="row.categoryId">
          <th scope="row">{{ row.name }}</th>
          <td class="num">{{ row.correct }} / {{ row.total }}</td>
        </tr>
      </tbody>
    </table>

    <section v-if="wrongItems.length > 0" aria-labelledby="exam-wrong-heading">
      <h2 id="exam-wrong-heading">Falsch oder nicht beantwortet ({{ wrongItems.length }})</h2>
      <WrongAnswerList :items="wrongItems" />
    </section>
  </section>
</template>

<style scoped>
.verdict {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0 0 var(--space-3);
  padding: var(--space-2) var(--space-4);
  border: 2px solid;
  border-radius: var(--radius);
  font-size: 1.25rem;
  font-weight: 700;
}

.verdict--passed {
  border-color: var(--color-success);
  background: var(--color-success-bg);
  color: var(--color-success);
}

.verdict--failed {
  border-color: var(--color-error);
  background: var(--color-error-bg);
  color: var(--color-error);
}

.score {
  font-size: 1.5rem;
  margin: 0 0 var(--space-2);
}

.details {
  margin: 0 0 var(--space-2);
}

.details--timeout {
  font-weight: 600;
}

.note {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin: var(--space-6) 0 var(--space-8);
}

.actions > * {
  flex: 1 1 12rem;
}

h2 {
  font-size: 1.125rem;
}

.categories {
  width: 100%;
  margin-bottom: var(--space-8);
  border-collapse: collapse;
  background: var(--color-surface);
}

.categories th,
.categories td {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.categories tbody th {
  font-weight: 400;
}

.categories .num {
  text-align: right;
  white-space: nowrap;
}
</style>
