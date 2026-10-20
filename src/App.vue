<script setup lang="ts">
import { quizData } from '@/data'
</script>

<template>
  <!-- Placeholder until the views are built in phase 2. -->
  <main>
    <h1>{{ quizData.meta.title }}</h1>
    <p>{{ quizData.meta.questionCount }} Fragen in {{ quizData.categories.length }} Kategorien</p>
  </main>
</template>
