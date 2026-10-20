<script setup lang="ts">
import { computed } from 'vue'
import ProgressBar from '@/components/ProgressBar.vue'
import { categories } from '@/data'
import type { Category } from '@/types/quiz'
import { useProgressStore } from '@/stores/progress'

const progress = useProgressStore()

const accuracy = computed(() =>
  progress.totals.attempts === 0
    ? null
    : Math.round((progress.totals.correct / progress.totals.attempts) * 100),
)

const rows = computed(() =>
  categories.map((category) => ({ category, summary: progress.categoryProgress(category.id) })),
)

function resetCategory(category: Category) {
  if (window.confirm(`Fortschritt für „${category.name}“ wirklich zurücksetzen?`)) {
    progress.resetCategory(category.id)
  }
}

function resetAll() {
  if (window.confirm('Gesamten Lernfortschritt wirklich zurücksetzen?')) {
    progress.resetAll()
  }
}
</script>

<template>
  <section>
    <h1>Statistik</h1>

    <dl class="summary">
      <div class="summary__item">
        <dt>Gelernt</dt>
        <dd>{{ progress.overall.learned }} / {{ progress.overall.total }}</dd>
      </div>
      <div class="summary__item">
        <dt>Bearbeitet</dt>
        <dd>{{ progress.answeredCount }} / {{ progress.overall.total }}</dd>
      </div>
      <div class="summary__item">
        <dt>Antworten</dt>
        <dd>{{ progress.totals.attempts }}</dd>
      </div>
      <div class="summary__item">
        <dt>Trefferquote</dt>
        <dd>{{ accuracy === null ? '–' : `${accuracy} %` }}</dd>
      </div>
    </dl>
    <p class="hint">
      Eine Frage gilt als gelernt, wenn du sie zweimal hintereinander richtig beantwortet hast.
    </p>

    <h2>Nach Kategorie</h2>
    <ul class="rows">
      <li v-for="{ category, summary } in rows" :key="category.id" class="row">
        <div class="row__head">
          <span class="row__name">{{ category.name }}</span>
          <span class="row__count">{{ summary.learned }} / {{ summary.total }}</span>
        </div>
        <ProgressBar
          :value="summary.learned"
          :max="summary.total"
          :label="`Gelernte Fragen in ${category.name}`"
        />
        <button type="button" class="row__reset" @click="resetCategory(category)">
          Zurücksetzen<span class="visually-hidden">: {{ category.name }}</span>
        </button>
      </li>
    </ul>

    <button type="button" class="btn btn--secondary btn--block" @click="resetAll">
      Gesamten Fortschritt zurücksetzen
    </button>
  </section>
</template>

<style scoped>
.summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  margin: 0 0 var(--space-3);
}

@media (min-width: 40rem) {
  .summary {
    grid-template-columns: repeat(4, 1fr);
  }
}

.summary__item {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}

.summary dt {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.summary dd {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.hint {
  margin: 0 0 var(--space-6);
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

h2 {
  font-size: 1.125rem;
}

.rows {
  display: grid;
  gap: var(--space-3);
  margin: 0 0 var(--space-8);
  padding: 0;
  list-style: none;
}

.row {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}

.row__head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.row__name {
  font-weight: 600;
}

.row__count {
  color: var(--color-text-muted);
  white-space: nowrap;
}

.row__reset {
  justify-self: end;
  min-height: 2.75rem;
  padding: 0 var(--space-2);
  border: 0;
  background: none;
  color: var(--color-primary);
  font: inherit;
  font-size: 0.875rem;
  text-decoration: underline;
  cursor: pointer;
}
</style>
