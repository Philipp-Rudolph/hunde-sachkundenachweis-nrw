import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { questions } from '@/data'
import { useQuizStore } from '@/stores/quiz'
import { useSettingsStore } from '@/stores/settings'

const category2 = questions.filter((q) => q.categoryId === 2)

describe('quiz store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('starts a category session in catalogue order', () => {
    const quiz = useQuizStore()
    quiz.startCategory(2)
    expect(quiz.hasSession).toBe(true)
    expect(quiz.info).toMatchObject({ mode: 'category', categoryId: 2 })
    expect(quiz.total).toBe(10)
    expect(quiz.currentQuestion?.id).toBe(category2[0]!.id)
  })

  it('ignores unknown categories', () => {
    const quiz = useQuizStore()
    quiz.startCategory(999)
    expect(quiz.hasSession).toBe(false)
  })

  it('cannot check without a selection and locks the selection after checking', () => {
    const quiz = useQuizStore()
    quiz.startCategory(2)
    expect(quiz.canCheck).toBe(false)
    quiz.check()
    expect(quiz.isChecked).toBe(false)

    quiz.toggleOption('A')
    expect(quiz.canCheck).toBe(true)
    quiz.check()
    expect(quiz.isChecked).toBe(true)
    expect(quiz.feedback).not.toBeNull()

    quiz.toggleOption('B')
    expect(quiz.selection).toEqual(['A'])
  })

  it('toggles options on and off', () => {
    const quiz = useQuizStore()
    quiz.startCategory(2)
    quiz.toggleOption('A')
    quiz.toggleOption('C')
    quiz.toggleOption('A')
    expect(quiz.selection).toEqual(['C'])
  })

  it('does not advance before checking', () => {
    const quiz = useQuizStore()
    quiz.startCategory(2)
    quiz.next()
    expect(quiz.currentIndex).toBe(0)
  })

  it('plays a full category and scores it correctly', () => {
    const quiz = useQuizStore()
    quiz.startCategory(2)

    // Answer even positions correctly, odd positions with a wrong (incomplete or wrong) choice.
    for (let i = 0; i < quiz.total; i++) {
      const question = quiz.currentQuestion!
      const answer =
        i % 2 === 0
          ? question.correctAnswers
          : question.options
              .filter((o) => !o.correct)
              .map((o) => o.id)
              .slice(0, 1)
      const selection = answer.length > 0 ? answer : question.correctAnswers.slice(0, 1)
      for (const id of selection) quiz.toggleOption(id)
      quiz.check()
      expect(quiz.finished).toBe(false)
      quiz.next()
    }

    expect(quiz.finished).toBe(true)
    expect(quiz.answers).toHaveLength(10)
    const expectedWrong = quiz.answers.filter((a) => !a.correct).length
    expect(expectedWrong).toBeGreaterThan(0)
    expect(quiz.score).toEqual({
      correct: 10 - expectedWrong,
      total: 10,
      ratio: (10 - expectedWrong) / 10,
    })
    expect(quiz.wrongAnswers).toHaveLength(expectedWrong)
  })

  it('repeats only the wrong questions', () => {
    const quiz = useQuizStore()
    quiz.startCategory(2)
    for (let i = 0; i < quiz.total; i++) {
      const question = quiz.currentQuestion!
      if (i < 3) {
        // Selecting every option is wrong unless all four are correct.
        for (const o of question.options) quiz.toggleOption(o.id)
      } else {
        for (const id of question.correctAnswers) quiz.toggleOption(id)
      }
      quiz.check()
      quiz.next()
    }
    const wrongIds = quiz.wrongAnswers.map((a) => a.questionId)

    quiz.repeatWrong()
    expect(quiz.questions.map((q) => q.id)).toEqual(wrongIds)
    expect(quiz.answers).toEqual([])
    expect(quiz.finished).toBe(false)
  })

  it('shuffles options according to the settings, keeping all option IDs', () => {
    useSettingsStore().shuffleOptions = true
    const quiz = useQuizStore()
    quiz.startCategory(2)
    const ids = quiz.currentOptions.map((o) => o.id)
    expect([...ids].sort()).toEqual(quiz.currentQuestion!.options.map((o) => o.id).sort())
    expect(quiz.currentOptions.map((o) => o.label)).toEqual(['A', 'B', 'C', 'D'])
  })
})
