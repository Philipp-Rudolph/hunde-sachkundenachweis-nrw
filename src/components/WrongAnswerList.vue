<script setup lang="ts">
import { computed } from 'vue'
import type { OptionId, Question } from '@/types/quiz'

const props = defineProps<{
  items: { question: Question; selected: OptionId[] }[]
}>()

const rows = computed(() =>
  props.items.map(({ question, selected }) => ({
    question,
    chosen: question.options.filter((o) => selected.includes(o.id)),
    correct: question.options.filter((o) => o.correct),
  })),
)
</script>

<template>
  <ol class="wrong">
    <li v-for="item in rows" :key="item.question.id" class="wrong__item">
      <p class="wrong__question">
        <span class="wrong__number">Frage {{ item.question.number }}:</span>
        {{ item.question.question }}
      </p>
      <p class="wrong__label">Deine Auswahl:</p>
      <ul v-if="item.chosen.length > 0" class="wrong__options">
        <li v-for="option in item.chosen" :key="option.id">
          <span aria-hidden="true">{{ option.correct ? '✓' : '✗' }}</span>
          <span class="visually-hidden">{{ option.correct ? 'richtig:' : 'falsch:' }}</span>
          {{ option.text }}
        </li>
      </ul>
      <p v-else class="wrong__none">Nicht beantwortet</p>
      <p class="wrong__label">Richtig:</p>
      <ul class="wrong__options wrong__options--correct">
        <li v-for="option in item.correct" :key="option.id">
          <span aria-hidden="true">✓</span> {{ option.text }}
        </li>
      </ul>
    </li>
  </ol>
</template>

<style scoped>
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

.wrong__none {
  margin: 0;
  padding-left: var(--space-4);
  font-style: italic;
}

.wrong__options--correct {
  color: var(--color-success);
}
</style>
