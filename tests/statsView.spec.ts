import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgressStore } from '@/stores/progress'
import StatsView from '@/views/StatsView.vue'

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const progress = useProgressStore()
  progress.record('q006', true) // category 1
  progress.record('q001', false) // category 2
  const wrapper = mount(StatsView, { global: { plugins: [pinia] } })
  return { progress, wrapper }
}

const buttonByText = (wrapper: ReturnType<typeof setup>['wrapper'], text: string) =>
  wrapper.findAll('button').filter((b) => b.text().includes(text))

describe('StatsView', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('does not reset when the confirmation is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { progress, wrapper } = setup()
    await buttonByText(wrapper, 'Gesamten Fortschritt')[0]!.trigger('click')
    expect(window.confirm).toHaveBeenCalled()
    expect(Object.keys(progress.stats)).toHaveLength(2)
  })

  it('resets a single category after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { progress, wrapper } = setup()
    await buttonByText(wrapper, 'Zurücksetzen')[0]!.trigger('click') // category 1
    expect(progress.stats.q006).toBeUndefined()
    expect(progress.stats.q001).toBeDefined()
  })

  it('resets everything after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { progress, wrapper } = setup()
    await buttonByText(wrapper, 'Gesamten Fortschritt')[0]!.trigger('click')
    expect(progress.stats).toEqual({})
  })
})
