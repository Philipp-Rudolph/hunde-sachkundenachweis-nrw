import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.vue'
import { EXAM_CONFIG } from '@/config/exam'
import router from '@/router'
import { useExamStore } from '@/stores/exam'
import { useSettingsStore } from '@/stores/settings'

const button = (wrapper: VueWrapper, text: string) =>
  wrapper.findAll('button').find((b) => b.text().includes(text))

async function startExam(timed: boolean) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useSettingsStore().examTimed = timed
  await router.push('/')
  const wrapper = mount(App, { global: { plugins: [pinia, router] } })
  await flushPromises()
  await button(wrapper, 'Prüfung starten')!.trigger('click')
  await flushPromises()
  return { wrapper, exam: useExamStore() }
}

describe('exam simulation flow', () => {
  // jsdom does not implement scrolling, which the router's scrollBehavior uses.
  beforeAll(() => {
    window.scrollTo = () => {}
  })
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('gives no feedback, supports flagging and overview, and shows the verdict', async () => {
    const { wrapper, exam } = await startExam(false)
    expect(router.currentRoute.value.name).toBe('exam')
    expect(wrapper.find('[role="timer"]').exists()).toBe(false)

    // Answer the first question correctly: no feedback and no "Prüfen" button.
    const first = exam.currentQuestion!
    const inputs = wrapper.findAll('input[type="checkbox"]')
    for (const id of first.correctAnswers) {
      await inputs[exam.currentOptions.findIndex((o) => o.id === id)]!.trigger('change')
    }
    expect(button(wrapper, 'Prüfen')).toBeUndefined()
    expect(wrapper.text()).not.toContain('Richtig gewählt')
    expect(wrapper.find('input:disabled').exists()).toBe(false)

    await button(wrapper, 'Später ansehen')!.trigger('click')
    expect(wrapper.get('[aria-pressed="true"]').text()).toContain('Markiert')

    await button(wrapper, 'Weiter')!.trigger('click')
    expect(wrapper.text()).toContain(`Frage 2 von ${EXAM_CONFIG.questionCount}`)

    await button(wrapper, 'Übersicht')!.trigger('click')
    expect(wrapper.text()).toContain(`1 von ${EXAM_CONFIG.questionCount} beantwortet`)
    expect(wrapper.get('[aria-label^="Frage 1:"]').attributes('aria-label')).toBe(
      'Frage 1: beantwortet, markiert',
    )

    // Jump back to question 1 from the overview.
    await wrapper.get('[aria-label^="Frage 1:"]').trigger('click')
    expect(wrapper.text()).toContain(`Frage 1 von ${EXAM_CONFIG.questionCount}`)
    await button(wrapper, 'Übersicht')!.trigger('click')

    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
    await button(wrapper, 'Prüfung abgeben')!.trigger('click')
    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining(`Noch ${EXAM_CONFIG.questionCount - 1} Fragen`),
    )
    expect(exam.submitted).toBe(false)

    confirm.mockReturnValueOnce(true)
    await button(wrapper, 'Prüfung abgeben')!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('exam-result')
    expect(wrapper.get('.verdict').text()).toContain('Nicht bestanden')
    expect(wrapper.text()).toContain(`1 von ${EXAM_CONFIG.questionCount}`)
    expect(wrapper.findAll('.categories tbody tr').length).toBe(exam.result!.byCategory.length)
    expect(wrapper.findAll('.wrong__item')).toHaveLength(EXAM_CONFIG.questionCount - 1)
    wrapper.unmount()
  })

  it('submits automatically when the time runs out', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    const { wrapper, exam } = await startExam(true)
    expect(wrapper.get('[role="timer"]').text()).toContain(`${EXAM_CONFIG.timeLimitMinutes}:00`)

    vi.advanceTimersByTime(EXAM_CONFIG.timeLimitMinutes * 60_000 - 1_000)
    await flushPromises()
    expect(wrapper.get('[role="timer"]').text()).toContain('0:01')
    expect(exam.submitted).toBe(false)

    vi.advanceTimersByTime(1_000)
    await flushPromises()
    expect(exam.submitted).toBe(true)
    expect(exam.timedOut).toBe(true)
    expect(router.currentRoute.value.name).toBe('exam-result')
    expect(wrapper.text()).toContain('Die Zeit ist abgelaufen')
    wrapper.unmount()
  })

  it('asks before leaving a running exam', async () => {
    const { wrapper, exam } = await startExam(false)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
    await router.push('/')
    expect(confirm).toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('exam')

    confirm.mockReturnValueOnce(true)
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('home')
    expect(exam.inProgress).toBe(false)
    wrapper.unmount()
  })
})
