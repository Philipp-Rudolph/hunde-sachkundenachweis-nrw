import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { RANDOM_SESSION_SIZES } from '@/lib/sessionBuilder'
import { loadState, saveState, type StorageSpec } from '@/lib/storage'

export type RandomSessionSize = (typeof RANDOM_SESSION_SIZES)[number]

export interface Settings {
  /** Shuffle question order in category practice (default: catalogue order). */
  shuffleQuestions: boolean
  /** Shuffle answer options; internal option IDs stay unchanged. */
  shuffleOptions: boolean
  /** Number of questions in random training. */
  randomCount: RandomSessionSize
}

const DEFAULT_SETTINGS: Settings = {
  shuffleQuestions: false,
  shuffleOptions: false,
  randomCount: 20,
}

/** Takes valid fields from stored data and falls back to defaults per field. */
export function parseSettings(data: unknown): Settings | null {
  if (typeof data !== 'object' || data === null) return null
  const s = data as Record<string, unknown>
  return {
    shuffleQuestions:
      typeof s.shuffleQuestions === 'boolean'
        ? s.shuffleQuestions
        : DEFAULT_SETTINGS.shuffleQuestions,
    shuffleOptions:
      typeof s.shuffleOptions === 'boolean' ? s.shuffleOptions : DEFAULT_SETTINGS.shuffleOptions,
    randomCount: RANDOM_SESSION_SIZES.includes(s.randomCount as RandomSessionSize)
      ? (s.randomCount as RandomSessionSize)
      : DEFAULT_SETTINGS.randomCount,
  }
}

export const SETTINGS_STORAGE: StorageSpec<Settings> = {
  key: 'sachkunde-quiz:settings',
  version: 1,
  defaults: () => ({ ...DEFAULT_SETTINGS }),
  parse: parseSettings,
}

export const useSettingsStore = defineStore('settings', () => {
  const initial = loadState(SETTINGS_STORAGE)
  const shuffleQuestions = ref(initial.shuffleQuestions)
  const shuffleOptions = ref(initial.shuffleOptions)
  const randomCount = ref<RandomSessionSize>(initial.randomCount)

  watch([shuffleQuestions, shuffleOptions, randomCount], () => {
    saveState(SETTINGS_STORAGE, {
      shuffleQuestions: shuffleQuestions.value,
      shuffleOptions: shuffleOptions.value,
      randomCount: randomCount.value,
    })
  })

  return { shuffleQuestions, shuffleOptions, randomCount }
})
