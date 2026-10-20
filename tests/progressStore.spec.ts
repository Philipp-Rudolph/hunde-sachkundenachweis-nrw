import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { PROGRESS_STORAGE, useProgressStore } from '@/stores/progress'
import { SETTINGS_STORAGE, useSettingsStore } from '@/stores/settings'
import { nextTick } from 'vue'

describe('progress store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('applies the learned rule: the last two attempts must be correct', () => {
    const progress = useProgressStore()
    progress.record('q006', true)
    expect(progress.isQuestionLearned('q006')).toBe(false)
    progress.record('q006', true)
    expect(progress.isQuestionLearned('q006')).toBe(true)
    progress.record('q006', false)
    expect(progress.isQuestionLearned('q006')).toBe(false)
    expect(progress.wrongIds).toEqual(['q006'])
  })

  it('computes category and overall progress', () => {
    const progress = useProgressStore()
    for (const id of ['q006', 'q016']) {
      progress.record(id, true)
      progress.record(id, true)
    }
    expect(progress.categoryProgress(1)).toEqual({ learned: 2, total: 7, ratio: 2 / 7 })
    expect(progress.overall.learned).toBe(2)
    expect(progress.overall.total).toBe(197)
  })

  it('persists under the versioned key and restores on a new instance', () => {
    const progress = useProgressStore()
    progress.record('q006', false)
    const stored = JSON.parse(localStorage.getItem(PROGRESS_STORAGE.key)!)
    expect(PROGRESS_STORAGE.key).toBe('sachkunde-quiz:v1')
    expect(stored.version).toBe(1)
    expect(stored.data.q006.lastResult).toBe('wrong')

    setActivePinia(createPinia())
    expect(useProgressStore().stats.q006?.attempts).toBe(1)
  })

  it('starts empty when the stored entry is corrupt', () => {
    localStorage.setItem(PROGRESS_STORAGE.key, 'garbage')
    expect(useProgressStore().stats).toEqual({})
  })

  it('resets a single category and keeps the others', () => {
    const progress = useProgressStore()
    progress.record('q006', true) // category 1
    progress.record('q001', true) // category 2
    progress.resetCategory(1)
    expect(progress.stats.q006).toBeUndefined()
    expect(progress.stats.q001).toBeDefined()
    expect(JSON.parse(localStorage.getItem(PROGRESS_STORAGE.key)!).data.q006).toBeUndefined()
  })

  it('resets everything', () => {
    const progress = useProgressStore()
    progress.record('q006', true)
    progress.record('q001', false)
    progress.resetAll()
    expect(progress.stats).toEqual({})
    expect(progress.wrongIds).toEqual([])
    setActivePinia(createPinia())
    expect(useProgressStore().stats).toEqual({})
  })
})

describe('settings store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('uses defaults and persists changes', async () => {
    const settings = useSettingsStore()
    expect(settings.randomCount).toBe(20)
    settings.shuffleOptions = true
    settings.randomCount = 50
    await nextTick()

    setActivePinia(createPinia())
    const restored = useSettingsStore()
    expect(restored.shuffleOptions).toBe(true)
    expect(restored.randomCount).toBe(50)
  })

  it('falls back per field for invalid stored values', () => {
    localStorage.setItem(
      SETTINGS_STORAGE.key,
      JSON.stringify({ version: 1, data: { shuffleQuestions: true, randomCount: 33 } }),
    )
    const settings = useSettingsStore()
    expect(settings.shuffleQuestions).toBe(true)
    expect(settings.shuffleOptions).toBe(false)
    expect(settings.randomCount).toBe(20)
  })
})
