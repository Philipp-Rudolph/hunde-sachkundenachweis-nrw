<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { questionImageUrl } from '@/data'
import type { OptionFeedback } from '@/lib/scoring'
import type { DisplayedOption } from '@/lib/sessionBuilder'
import type { OptionId, Question } from '@/types/quiz'
import OptionItem from './OptionItem.vue'

const props = defineProps<{
  question: Question
  options: DisplayedOption[]
  selected: OptionId[]
  feedback: Record<OptionId, OptionFeedback> | null
}>()

const emit = defineEmits<{ toggle: [id: OptionId] }>()

const imageUrl = computed(() =>
  props.question.image ? questionImageUrl(props.question.image.src) : null,
)
const altText = computed(() => `Zeichnung eines Hundes zur Frage ${props.question.number}`)

const heading = useTemplateRef<HTMLHeadingElement>('heading')

/** Moves focus to the question text, e.g. after switching questions. */
function focusHeading() {
  heading.value?.focus()
}

defineExpose({ focusHeading })

const zoomed = ref(false)
const zoomTrigger = useTemplateRef<HTMLButtonElement>('zoomTrigger')
const closeButton = useTemplateRef<HTMLButtonElement>('closeButton')

async function openZoom() {
  zoomed.value = true
  await nextTick()
  closeButton.value?.focus()
}

async function closeZoom() {
  zoomed.value = false
  await nextTick()
  zoomTrigger.value?.focus()
}
</script>

<template>
  <article class="question">
    <p class="question__number">Frage {{ question.number }}</p>
    <h2 ref="heading" class="question__text" tabindex="-1">{{ question.question }}</h2>

    <button
      v-if="question.image && imageUrl"
      ref="zoomTrigger"
      type="button"
      class="question__image-button"
      :aria-label="`${altText} – zum Vergrößern antippen`"
      @click="openZoom"
    >
      <img
        class="question__image"
        :src="imageUrl"
        :width="question.image.width"
        :height="question.image.height"
        :alt="altText"
      />
    </button>

    <fieldset class="question__options">
      <legend class="visually-hidden">Antworten (Mehrfachauswahl möglich)</legend>
      <OptionItem
        v-for="option in options"
        :key="option.id"
        :option="option"
        :selected="selected.includes(option.id)"
        :feedback="feedback ? feedback[option.id] : null"
        @toggle="emit('toggle', option.id)"
      />
    </fieldset>

    <div
      v-if="zoomed && question.image && imageUrl"
      class="zoom"
      role="dialog"
      aria-modal="true"
      :aria-label="altText"
      @click="closeZoom"
      @keydown.esc="closeZoom"
    >
      <img
        class="zoom__image"
        :src="imageUrl"
        :width="question.image.width"
        :height="question.image.height"
        :alt="altText"
      />
      <button ref="closeButton" type="button" class="btn zoom__close" @click.stop="closeZoom">
        Schließen
      </button>
    </div>
  </article>
</template>

<style scoped>
.question__number {
  margin: 0 0 var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.875rem;
  font-weight: 600;
}

.question__text {
  font-size: 1.25rem;
}

.question__image-button {
  display: block;
  width: 100%;
  margin: 0 0 var(--space-4);
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: #fff;
  cursor: zoom-in;
  overflow: hidden;
}

.question__image {
  display: block;
  width: 100%;
}

.question__options {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  border: 0;
}

.zoom {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-overlay);
  cursor: zoom-out;
}

.zoom__image {
  max-height: calc(100vh - 6rem);
  width: auto;
  object-fit: contain;
  background: #fff;
  border-radius: var(--radius);
}
</style>
