import { describe, expect, it } from 'vitest'
import { evaluateOptions, isAnswerCorrect, scoreSession } from '@/lib/scoring'
import type { Question } from '@/types/quiz'

function makeQuestion(correct: Question['correctAnswers']): Question {
  return {
    id: 'q999',
    number: 999,
    categoryId: 1,
    question: 'Test?',
    image: null,
    options: (['A', 'B', 'C', 'D'] as const).map((id) => ({
      id,
      text: `Option ${id}`,
      correct: correct.includes(id),
    })),
    correctAnswers: correct,
    multipleCorrect: correct.length > 1,
  }
}

describe('isAnswerCorrect', () => {
  const question = makeQuestion(['A', 'C'])

  it('accepts the exact set, regardless of order', () => {
    expect(isAnswerCorrect(question, ['A', 'C'])).toBe(true)
    expect(isAnswerCorrect(question, ['C', 'A'])).toBe(true)
  })

  it('rejects too few selections', () => {
    expect(isAnswerCorrect(question, ['A'])).toBe(false)
  })

  it('rejects too many selections', () => {
    expect(isAnswerCorrect(question, ['A', 'B', 'C'])).toBe(false)
  })

  it('rejects wrong selections of the right size', () => {
    expect(isAnswerCorrect(question, ['B', 'D'])).toBe(false)
  })

  it('rejects an empty selection', () => {
    expect(isAnswerCorrect(question, [])).toBe(false)
  })

  it('ignores duplicate IDs in the selection', () => {
    expect(isAnswerCorrect(question, ['A', 'A', 'C'])).toBe(true)
  })

  it('handles questions where all options are correct', () => {
    const all = makeQuestion(['A', 'B', 'C', 'D'])
    expect(isAnswerCorrect(all, ['A', 'B', 'C', 'D'])).toBe(true)
    expect(isAnswerCorrect(all, ['A', 'B', 'C'])).toBe(false)
  })
})

describe('evaluateOptions', () => {
  it('marks each option as correct-selected, wrong-selected, missed or neutral', () => {
    const question = makeQuestion(['A', 'C'])
    expect(evaluateOptions(question, ['A', 'B'])).toEqual({
      A: 'correct-selected',
      B: 'wrong-selected',
      C: 'missed',
      D: 'neutral',
    })
  })
})

describe('scoreSession', () => {
  it('computes correct count and ratio', () => {
    expect(scoreSession([true, false, true, true])).toEqual({ correct: 3, total: 4, ratio: 0.75 })
  })

  it('returns ratio 0 for an empty session', () => {
    expect(scoreSession([])).toEqual({ correct: 0, total: 0, ratio: 0 })
  })
})
