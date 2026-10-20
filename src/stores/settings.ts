import { defineStore } from 'pinia'
import { ref } from 'vue'

// TODO(phase 3): persist via the storage layer.
export const useSettingsStore = defineStore('settings', () => {
  /** Shuffle question order in category practice (default: catalogue order). */
  const shuffleQuestions = ref(false)
  /** Shuffle answer options; internal option IDs stay unchanged. */
  const shuffleOptions = ref(false)

  return { shuffleQuestions, shuffleOptions }
})
