import { describe, expect, it } from 'vitest'
import { EXAM_CONFIG } from '@/config/exam'
import { questions } from '@/data'
import { evaluateExam, formatDuration, isPassed, remainingSeconds } from '@/lib/exam'

const byId = (id: string) => questions.find((q) => q.id === id)!
const q6 = byId('q006') // category 1
const q16 = byId('q016') // category 1
const q1 = byId('q001') // category 2
const q31 = byId('q031') // category 2
const sample = [q6, q16, q1, q31]

describe('isPassed', () => {
  it('passes at or above the threshold', () => {
    expect(isPassed(20, 20)).toBe(true)
    expect(isPassed(21, 20)).toBe(true)
    expect(isPassed(19, 20)).toBe(false)
  })
})

describe('evaluateExam', () => {
  it('scores exact answers, counts unanswered as wrong and groups by category', () => {
    const result = evaluateExam(
      sample,
      {
        [q6.id]: q6.correctAnswers,
        [q16.id]: q16.options.map((o) => o.id).filter((id) => !q16.correctAnswers.includes(id)),
        [q1.id]: q1.correctAnswers,
        // q31 unanswered
      },
      2,
    )
    expect(result).toMatchObject({ correct: 2, total: 4, ratio: 0.5, passed: true, unanswered: 1 })
    expect(result.questions.find((r) => r.questionId === q31.id)).toMatchObject({
      answered: false,
      correct: false,
      selected: [],
    })
    expect(result.byCategory).toEqual([
      { categoryId: 1, correct: 1, total: 2 },
      { categoryId: 2, correct: 1, total: 2 },
    ])
  })

  it('fails below the threshold', () => {
    expect(evaluateExam(sample, {}, 2)).toMatchObject({
      correct: 0,
      passed: false,
      unanswered: 4,
    })
  })
})

describe('timer helpers', () => {
  it('computes remaining whole seconds, never negative', () => {
    expect(remainingSeconds(10_000, 0)).toBe(10)
    expect(remainingSeconds(10_000, 9_001)).toBe(1)
    expect(remainingSeconds(10_000, 12_000)).toBe(0)
  })

  it('formats durations as m:ss', () => {
    expect(formatDuration(45 * 60)).toBe('45:00')
    expect(formatDuration(9)).toBe('0:09')
    expect(formatDuration(61)).toBe('1:01')
  })
})

describe('exam config', () => {
  it('matches the official exam format and has a sane time limit', () => {
    expect(EXAM_CONFIG.questionCount).toBe(30)
    expect(EXAM_CONFIG.passMinCorrect).toBe(20)
    expect(EXAM_CONFIG.questionCount).toBeGreaterThan(0)
    expect(EXAM_CONFIG.questionCount).toBeLessThanOrEqual(questions.length)
    expect(EXAM_CONFIG.passMinCorrect).toBeGreaterThan(0)
    expect(EXAM_CONFIG.passMinCorrect).toBeLessThanOrEqual(EXAM_CONFIG.questionCount)
    expect(EXAM_CONFIG.timeLimitMinutes).toBeGreaterThan(0)
  })
})
