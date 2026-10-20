import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.vue'
import OptionItem from '@/components/OptionItem.vue'
import { EXAM_CONFIG } from '@/config/exam'
import router from '@/router'
import { useExamStore } from '@/stores/exam'
import { useQuizStore } from '@/stores/quiz'
import { useSettingsStore } from '@/stores/settings'

const press = (key: string, target: EventTarget = document.body) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))

const buttonByText = (wrapper: VueWrapper, text: string) =>
  wrapper.findAll('button').find((b) => b.text().includes(text))

async function mountApp(path: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  await router.push(path)
  const wrapper = mount(App, { global: { plugins: [pinia, router] }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

describe('accessibility', () => {
  // jsdom does not implement scrolling, which the router's scrollBehavior uses.
  beforeAll(() => {
    window.scrollTo = () => {}
  })
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('toggles an option with Enter like with Space', async () => {
    const option = { id: 'A' as const, text: 'Text', correct: true, label: 'A' }
    const wrapper = mount(OptionItem, { props: { option, selected: false, feedback: null } })
    await wrapper.get('input').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('toggle')).toHaveLength(1)

    await wrapper.setProps({ feedback: 'correct-selected' })
    await wrapper.get('input').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })

  it('supports letter shortcuts, Enter to check and continue, and focuses the next question', async () => {
    const wrapper = await mountApp('/kategorien')
    await wrapper.findAll('.tile')[1]!.trigger('click')
    await flushPromises()
    const quiz = useQuizStore()
    const first = quiz.currentQuestion!

    // Enter without a selection does nothing.
    press('Enter')
    await flushPromises()
    expect(quiz.isChecked).toBe(false)

    for (const option of quiz.currentOptions.filter((o) => o.correct))
      press(option.label.toLowerCase())
    await flushPromises()
    expect([...quiz.selection].sort()).toEqual([...first.correctAnswers].sort())

    press('Enter')
    await flushPromises()
    expect(quiz.isChecked).toBe(true)
    expect(wrapper.get('[aria-live="polite"]').text()).toContain('Richtig!')

    // The primary button keeps focus after checking because it is the same element.
    const primary = buttonByText(wrapper, 'Weiter')!
    expect(primary.attributes('disabled')).toBeUndefined()

    press('Enter')
    await flushPromises()
    expect(quiz.currentIndex).toBe(1)
    expect(document.activeElement?.tagName).toBe('H2')
    expect(document.activeElement?.textContent).toBe(quiz.currentQuestion!.question)
    wrapper.unmount()
  })

  it('ignores shortcuts while typing in a text field', async () => {
    const wrapper = await mountApp('/kategorien')
    await wrapper.findAll('.tile')[0]!.trigger('click')
    await flushPromises()
    const input = document.createElement('input')
    document.body.appendChild(input)
    press('a', input)
    expect(useQuizStore().selection).toEqual([])
    input.remove()
    wrapper.unmount()
  })

  it('sets the document title and focuses the page heading on navigation', async () => {
    const wrapper = await mountApp('/')
    expect(document.title).toBe('Start · Sachkunde-Quiz')
    await router.push('/statistik')
    await flushPromises()
    expect(document.title).toBe('Statistik · Sachkunde-Quiz')
    expect(document.activeElement?.tagName).toBe('H1')
    expect(document.activeElement?.textContent).toBe('Statistik')
    wrapper.unmount()
  })

  it('offers a skip link to the main content', async () => {
    const wrapper = await mountApp('/')
    expect(wrapper.get('a.skip-link').attributes('href')).toBe('#main')
    expect(wrapper.find('main#main').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows an empty state on the statistics page without progress', async () => {
    const wrapper = await mountApp('/statistik')
    expect(wrapper.text()).toContain('Du hast noch keine Fragen beantwortet')
    expect(buttonByText(wrapper, 'Gesamten Fortschritt')).toBeUndefined()
    expect(buttonByText(wrapper, 'Zurücksetzen')).toBeUndefined()
    wrapper.unmount()
  })

  it('announces the remaining exam time at 5 minutes and 1 minute', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    const pinia = createPinia()
    setActivePinia(pinia)
    useSettingsStore().examTimed = true
    useExamStore().start()
    await router.push('/pruefung')
    const wrapper = mount(App, { global: { plugins: [pinia, router] } })
    await flushPromises()
    const live = () => wrapper.get('[aria-live="assertive"]').text()
    expect(live()).toBe('')

    vi.advanceTimersByTime((EXAM_CONFIG.timeLimitMinutes - 5) * 60_000)
    await flushPromises()
    expect(live()).toBe('Noch 5 Minuten.')

    vi.advanceTimersByTime(4 * 60_000)
    await flushPromises()
    expect(live()).toBe('Noch eine Minute.')
    wrapper.unmount()
  })
})
