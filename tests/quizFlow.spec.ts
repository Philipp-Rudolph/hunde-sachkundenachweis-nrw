import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeAll, describe, expect, it } from 'vitest'
import App from '@/App.vue'
import { questions } from '@/data'
import router from '@/router'

// Plays a whole category through the real UI: categories → quiz → result.
describe('category practice flow', () => {
  // jsdom does not implement scrolling, which the router's scrollBehavior uses.
  beforeAll(() => {
    window.scrollTo = () => {}
  })

  it('can be played to the end with a correct result', async () => {
    localStorage.clear()
    const pinia = createPinia()
    setActivePinia(pinia)
    router.push('/kategorien')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [pinia, router] } })
    await flushPromises()

    await wrapper.findAll('.tile')[1]!.trigger('click') // category 2
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('quiz')

    const category = questions.filter((q) => q.categoryId === 2)
    const answerWrongAt = new Set([0, 4])

    for (let i = 0; i < category.length; i++) {
      const question = category[i]!
      expect(wrapper.text()).toContain(`Frage ${i + 1} von ${category.length}`)
      expect(wrapper.text()).toContain(question.question)

      const checkButton = wrapper.findAll('button').find((b) => b.text() === 'Prüfen')!
      expect(checkButton.attributes('disabled')).toBeDefined()

      const ids = answerWrongAt.has(i)
        ? question.options.map((o) => o.id) // all options: wrong unless all are correct
        : question.correctAnswers
      const inputs = wrapper.findAll('input[type="checkbox"]')
      for (const id of ids) {
        const index = question.options.findIndex((o) => o.id === id)
        await inputs[index]!.trigger('change')
      }
      expect(checkButton.attributes('disabled')).toBeUndefined()
      await checkButton.trigger('click')

      const expectCorrect = !answerWrongAt.has(i) || question.correctAnswers.length === 4
      expect(wrapper.get('[aria-live="polite"]').text()).toContain(
        expectCorrect ? 'Richtig!' : 'Leider falsch',
      )

      const nextLabel = i === category.length - 1 ? 'Zum Ergebnis' : 'Weiter'
      await wrapper
        .findAll('button')
        .find((b) => b.text() === nextLabel)!
        .trigger('click')
      await flushPromises()
    }

    expect(router.currentRoute.value.name).toBe('result')
    const wrongCount = [...answerWrongAt].filter(
      (i) => category[i]!.correctAnswers.length < 4,
    ).length
    expect(wrapper.text()).toContain(`${category.length - wrongCount} von ${category.length}`)
    expect(wrapper.findAll('.wrong__item')).toHaveLength(wrongCount)
    wrapper.unmount()
  })

  it('redirects to home when opening the quiz without a session', async () => {
    setActivePinia(createPinia())
    await router.push('/quiz')
    expect(router.currentRoute.value.name).toBe('home')
  })
})
