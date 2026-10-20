import { describe, expect, it } from 'vitest'
import { questions } from '@/data'
import {
  arrangeOptions,
  buildCategorySession,
  buildMistakesSession,
  buildRandomSession,
} from '@/lib/sessionBuilder'

describe('buildCategorySession', () => {
  it('returns all questions of the category in catalogue order', () => {
    const session = buildCategorySession(questions, 2)
    expect(session).toHaveLength(10)
    expect(session.every((q) => q.categoryId === 2)).toBe(true)
    const numbers = session.map((q) => q.number)
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b))
  })

  it('shuffles reproducibly with a seed and keeps the same questions', () => {
    const ordered = buildCategorySession(questions, 2)
    const shuffled = buildCategorySession(questions, 2, { shuffle: true, seed: 3 })
    expect(shuffled).toEqual(buildCategorySession(questions, 2, { shuffle: true, seed: 3 }))
    expect(new Set(shuffled.map((q) => q.id))).toEqual(new Set(ordered.map((q) => q.id)))
  })

  it('returns an empty session for an unknown category', () => {
    expect(buildCategorySession(questions, 999)).toEqual([])
  })
})

describe('buildRandomSession', () => {
  it('returns the requested number of distinct questions', () => {
    const session = buildRandomSession(questions, 20, 11)
    expect(session).toHaveLength(20)
    expect(new Set(session.map((q) => q.id)).size).toBe(20)
  })

  it('caps the size at the pool size', () => {
    expect(buildRandomSession(questions.slice(0, 5), 10)).toHaveLength(5)
  })

  it('returns nothing for a non-positive count', () => {
    expect(buildRandomSession(questions, 0)).toEqual([])
  })
})

describe('buildMistakesSession', () => {
  it('returns only the given IDs, in catalogue order, ignoring unknown IDs', () => {
    const session = buildMistakesSession(questions, ['q050', 'q006', 'unknown'])
    expect(session.map((q) => q.id)).toEqual(['q006', 'q050'])
  })

  it('returns an empty session when there are no mistakes', () => {
    expect(buildMistakesSession(questions, [])).toEqual([])
  })
})

describe('arrangeOptions', () => {
  const question = questions.find((q) => q.options.length === 4)!

  it('keeps the original order by default', () => {
    const arranged = arrangeOptions(question)
    expect(arranged.map((o) => o.id)).toEqual(['A', 'B', 'C', 'D'])
    expect(arranged.map((o) => o.label)).toEqual(['A', 'B', 'C', 'D'])
  })

  it('keeps internal IDs but relabels by position when shuffled', () => {
    const arranged = arrangeOptions(question, { shuffle: true, seed: 5 })
    expect(arranged.map((o) => o.label)).toEqual(['A', 'B', 'C', 'D'])
    expect(arranged.map((o) => o.id).sort()).toEqual(['A', 'B', 'C', 'D'])
    for (const option of arranged) {
      expect(option.correct).toBe(question.correctAnswers.includes(option.id))
    }
  })

  it('handles questions with only two options', () => {
    const q118 = questions.find((q) => q.number === 118)!
    expect(arrangeOptions(q118, { shuffle: true, seed: 1 }).map((o) => o.label)).toEqual(['A', 'B'])
  })
})
