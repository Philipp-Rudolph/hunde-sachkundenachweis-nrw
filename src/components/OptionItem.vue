<script setup lang="ts">
import { computed } from 'vue'
import type { OptionFeedback } from '@/lib/scoring'
import type { DisplayedOption } from '@/lib/sessionBuilder'

const props = defineProps<{
  option: DisplayedOption
  selected: boolean
  /** Set after checking; null while the question is still open. */
  feedback: OptionFeedback | null
}>()

const emit = defineEmits<{ toggle: [] }>()

const FEEDBACK_TEXT: Record<OptionFeedback, string> = {
  'correct-selected': 'Richtig gewählt',
  'wrong-selected': 'Falsch gewählt',
  missed: 'Richtig, aber nicht gewählt',
  neutral: '',
}

const FEEDBACK_ICON: Record<OptionFeedback, string> = {
  'correct-selected': '✓',
  'wrong-selected': '✗',
  missed: '✓',
  neutral: '',
}

const locked = computed(() => props.feedback !== null)
const feedbackText = computed(() => (props.feedback ? FEEDBACK_TEXT[props.feedback] : ''))
const feedbackIcon = computed(() => (props.feedback ? FEEDBACK_ICON[props.feedback] : ''))
</script>

<template>
  <label
    class="option"
    :class="[
      feedback && `option--${feedback}`,
      { 'option--selected': selected, 'option--locked': locked },
    ]"
  >
    <input
      type="checkbox"
      class="option__input"
      :checked="selected"
      :disabled="locked"
      @change="emit('toggle')"
    />
    <span class="option__label" aria-hidden="true">{{ option.label }}</span>
    <span class="option__text">
      <span class="visually-hidden">Antwort {{ option.label }}: </span>{{ option.text }}
      <span v-if="feedbackText" class="option__feedback">
        <span aria-hidden="true">{{ feedbackIcon }}</span> {{ feedbackText }}
      </span>
    </span>
  </label>
</template>

<style scoped>
.option {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  cursor: pointer;
}

.option--locked {
  cursor: default;
}

.option--selected {
  border-color: var(--color-primary);
}

.option__input {
  flex: none;
  width: 1.25rem;
  height: 1.25rem;
  margin: 0.15rem 0 0;
  accent-color: var(--color-primary);
}

.option__label {
  flex: none;
  font-weight: 700;
  min-width: 1ch;
}

.option__text {
  flex: 1;
}

.option__feedback {
  display: block;
  margin-top: var(--space-1);
  font-size: 0.875rem;
  font-weight: 600;
}

.option--correct-selected {
  border-color: var(--color-success);
  background: var(--color-success-bg);
}

.option--correct-selected .option__feedback {
  color: var(--color-success);
}

.option--wrong-selected {
  border-color: var(--color-error);
  background: var(--color-error-bg);
}

.option--wrong-selected .option__feedback {
  color: var(--color-error);
}

.option--missed {
  border-color: var(--color-missed);
  border-style: dashed;
  background: var(--color-missed-bg);
}

.option--missed .option__feedback {
  color: var(--color-missed);
}
</style>
