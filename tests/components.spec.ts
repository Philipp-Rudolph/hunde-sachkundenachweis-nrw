import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import OptionItem from '@/components/OptionItem.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import { questions } from '@/data'
import { arrangeOptions } from '@/lib/sessionBuilder'

const imageQuestion = questions.find((q) => q.image !== null)!
const textQuestion = questions.find((q) => q.image === null && q.multipleCorrect)!
const singleCorrectQuestion = questions.find((q) => !q.multipleCorrect && q.options.length === 4)!

describe('OptionItem', () => {
  const option = { id: 'B' as const, text: 'Antworttext', correct: true, label: 'A' }

  it('renders a checkbox with the display label and emits toggle', async () => {
    const wrapper = mount(OptionItem, { props: { option, selected: false, feedback: null } })
    expect(wrapper.text()).toContain('A')
    expect(wrapper.text()).toContain('Antworttext')
    await wrapper.get('input[type="checkbox"]').trigger('change')
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })

  it('shows text feedback and disables the checkbox after checking', () => {
    const wrapper = mount(OptionItem, { props: { option, selected: false, feedback: 'missed' } })
    expect(wrapper.text()).toContain('Richtig, aber nicht gewählt')
    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
  })
})

describe('QuestionCard', () => {
  it('always renders checkboxes, also for single-answer questions', () => {
    const wrapper = mount(QuestionCard, {
      props: {
        question: singleCorrectQuestion,
        options: arrangeOptions(singleCorrectQuestion),
        selected: [],
        feedback: null,
      },
    })
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(4)
    expect(wrapper.find('input[type="radio"]').exists()).toBe(false)
  })

  it('renders the image with intrinsic size and alt text, and zooms on tap', async () => {
    const wrapper = mount(QuestionCard, {
      props: {
        question: imageQuestion,
        options: arrangeOptions(imageQuestion),
        selected: [],
        feedback: null,
      },
      attachTo: document.body,
    })
    const img = wrapper.get('img')
    expect(img.attributes('width')).toBe(String(imageQuestion.image!.width))
    expect(img.attributes('height')).toBe(String(imageQuestion.image!.height))
    expect(img.attributes('alt')).toBe(`Zeichnung eines Hundes zur Frage ${imageQuestion.number}`)

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    await wrapper.get('button[aria-label="Bild vergrößern"]').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    await wrapper.get('[role="dialog"] button').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders no image for text questions and forwards toggles with the option ID', async () => {
    const wrapper = mount(QuestionCard, {
      props: {
        question: textQuestion,
        options: arrangeOptions(textQuestion),
        selected: [],
        feedback: null,
      },
    })
    expect(wrapper.find('img').exists()).toBe(false)
    await wrapper.findAll('input')[2]!.trigger('change')
    expect(wrapper.emitted('toggle')).toEqual([['C']])
  })
})
