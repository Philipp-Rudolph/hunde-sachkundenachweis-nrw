<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: number
  max: number
  /** Accessible name, e.g. "Fortschritt in der Runde". */
  label: string
}>()

const percent = computed(() =>
  props.max > 0 ? Math.min(100, Math.max(0, (props.value / props.max) * 100)) : 0,
)
</script>

<template>
  <div
    class="progress"
    role="progressbar"
    :aria-label="label"
    aria-valuemin="0"
    :aria-valuemax="max"
    :aria-valuenow="value"
  >
    <div class="progress__fill" :style="{ width: `${percent}%` }" />
  </div>
</template>

<style scoped>
.progress {
  height: 0.5rem;
  border-radius: 999px;
  background: var(--color-border);
  overflow: hidden;
}

.progress__fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.2s ease;
}
</style>
