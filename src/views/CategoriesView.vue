<script setup lang="ts">
import { useRouter } from 'vue-router'
import CategoryTile from '@/components/CategoryTile.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import { categories } from '@/data'
import { useProgressStore } from '@/stores/progress'
import { useQuizStore } from '@/stores/quiz'

const router = useRouter()
const quiz = useQuizStore()
const progress = useProgressStore()

function startCategory(categoryId: number) {
  if (quiz.startCategory(categoryId)) router.push({ name: 'quiz' })
}
</script>

<template>
  <section>
    <h1>Kategorien</h1>
    <ul class="categories">
      <li v-for="category in categories" :key="category.id">
        <CategoryTile :category="category" @select="startCategory(category.id)">
          <span class="tile-progress">
            {{ progress.categoryProgress(category.id).learned }} gelernt
          </span>
          <ProgressBar
            :value="progress.categoryProgress(category.id).learned"
            :max="category.questionCount"
            :label="`Gelernte Fragen in ${category.name}`"
          />
        </CategoryTile>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.categories {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.tile-progress {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

@media (min-width: 40rem) {
  .categories {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
