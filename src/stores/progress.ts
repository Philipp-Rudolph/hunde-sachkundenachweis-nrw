import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { questions as allQuestions } from '@/data'
import {
  isLearned,
  parseProgress,
  recordAnswer,
  summarizeProgress,
  wrongQuestionIds,
  type ProgressMap,
} from '@/lib/progress'
import { loadState, saveState, type StorageSpec } from '@/lib/storage'

export const PROGRESS_STORAGE: StorageSpec<ProgressMap> = {
  key: 'sachkunde-quiz:v1',
  version: 1,
  defaults: () => ({}),
  parse: parseProgress,
}

export const useProgressStore = defineStore('progress', () => {
  const stats = ref<ProgressMap>(loadState(PROGRESS_STORAGE))

  const overall = computed(() => summarizeProgress(allQuestions, stats.value))
  const wrongIds = computed(() => wrongQuestionIds(stats.value))
  const answeredCount = computed(() => Object.keys(stats.value).length)
  const totals = computed(() => {
    let attempts = 0
    let correct = 0
    for (const s of Object.values(stats.value)) {
      attempts += s.attempts
      correct += s.correct
    }
    return { attempts, correct }
  })

  function persist() {
    saveState(PROGRESS_STORAGE, stats.value)
  }

  function record(questionId: string, correct: boolean, now = new Date()) {
    stats.value = {
      ...stats.value,
      [questionId]: recordAnswer(stats.value[questionId], correct, now),
    }
    persist()
  }

  function isQuestionLearned(questionId: string): boolean {
    return isLearned(stats.value[questionId])
  }

  function categoryProgress(categoryId: number) {
    return summarizeProgress(
      allQuestions.filter((q) => q.categoryId === categoryId),
      stats.value,
    )
  }

  function resetCategory(categoryId: number) {
    const ids = new Set(allQuestions.filter((q) => q.categoryId === categoryId).map((q) => q.id))
    stats.value = Object.fromEntries(Object.entries(stats.value).filter(([id]) => !ids.has(id)))
    persist()
  }

  function resetAll() {
    stats.value = {}
    persist()
  }

  return {
    stats,
    overall,
    wrongIds,
    answeredCount,
    totals,
    record,
    isQuestionLearned,
    categoryProgress,
    resetCategory,
    resetAll,
  }
})
