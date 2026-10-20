<script setup lang="ts">
import type { Category } from '@/types/quiz'

defineProps<{ category: Category }>()
defineEmits<{ select: [] }>()
</script>

<template>
  <button type="button" class="tile" @click="$emit('select')">
    <span class="tile__name">{{ category.name }}</span>
    <span class="tile__meta">{{ category.questionCount }} Fragen</span>
    <slot />
  </button>
</template>

<style scoped>
.tile {
  display: grid;
  gap: var(--space-1);
  width: 100%;
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  box-shadow: var(--shadow);
  color: var(--color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.tile:hover {
  border-color: var(--color-primary);
}

.tile__name {
  font-weight: 600;
}

.tile__meta {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
</style>
