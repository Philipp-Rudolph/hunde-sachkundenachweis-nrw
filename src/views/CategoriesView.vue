<script setup lang="ts">
import { useRouter } from 'vue-router'
import CategoryTile from '@/components/CategoryTile.vue'
import { categories } from '@/data'
import { useQuizStore } from '@/stores/quiz'

const router = useRouter()
const quiz = useQuizStore()

function startCategory(categoryId: number) {
  quiz.startCategory(categoryId)
  router.push({ name: 'quiz' })
}
</script>

<template>
  <section>
    <h1>Kategorien</h1>
    <ul class="categories">
      <li v-for="category in categories" :key="category.id">
        <CategoryTile :category="category" @select="startCategory(category.id)" />
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

@media (min-width: 40rem) {
  .categories {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
