import { describe, expect, it } from 'vitest'
import { questions } from '@/data'
import {
  HISTORY_LENGTH,
  isLearned,
  parseProgress,
  recordAnswer,
  summarizeProgress,
  wrongQuestionIds,
  type QuestionStats,
} from '@/lib/progress'

const now = new Date('2026-01-01T10:00:00Z')

function play(results: boolean[]): QuestionStats | undefined {
  return results.reduce<QuestionStats | undefined>((s, r) => recordAnswer(s, r, now), undefined)
}

describe('recordAnswer', () => {
  it('counts attempts and correct answers and stores the last result', () => {
    const stats = play([true, false, true])
    expect(stats).toEqual({
      attempts: 3,
      correct: 2,
      lastResult: 'correct',
      lastSeen: now.toISOString(),
      history: [true, false, true],
    })
  })

  it(`keeps at most ${HISTORY_LENGTH} history entries, newest last`, () => {
    const stats = play([false, true, true, true, true, false, true])!
    expect(stats.history).toEqual([true, true, true, false, true])
    expect(stats.attempts).toBe(7)
  })
})

describe('isLearned', () => {
  it('is false without enough attempts', () => {
    expect(isLearned(undefined)).toBe(false)
    expect(isLearned(play([true]))).toBe(false)
  })

  it('is true when the last two attempts were correct', () => {
    expect(isLearned(play([true, true]))).toBe(true)
    expect(isLearned(play([false, false, true, true]))).toBe(true)
  })

  it('is false when one of the last two attempts was wrong', () => {
    expect(isLearned(play([true, false]))).toBe(false)
    expect(isLearned(play([false, true]))).toBe(false)
    expect(isLearned(play([true, true, false]))).toBe(false)
  })
})

describe('summarizeProgress and wrongQuestionIds', () => {
  const progress = {
    q006: play([true, true])!,
    q016: play([true])!,
    q026: play([true, false])!,
  }

  it('counts learned questions of the given set', () => {
    const category1 = questions.filter((q) => q.categoryId === 1)
    expect(summarizeProgress(category1, progress)).toEqual({
      learned: 1,
      total: 7,
      ratio: 1 / 7,
    })
    expect(summarizeProgress([], progress).ratio).toBe(0)
  })

  it('lists questions whose last answer was wrong', () => {
    expect(wrongQuestionIds(progress)).toEqual(['q026'])
  })
})

describe('parseProgress', () => {
  it('rejects non-objects', () => {
    expect(parseProgress(null)).toBeNull()
    expect(parseProgress([])).toBeNull()
    expect(parseProgress('x')).toBeNull()
  })

  it('keeps valid entries and drops malformed ones', () => {
    const valid = play([true])!
    expect(parseProgress({ q001: valid, q002: { attempts: 'x' }, q003: null })).toEqual({
      q001: valid,
    })
  })
})
