import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { categories, questionImageUrl, questions, quizData } from '@/data'

// Vitest runs with the project root as cwd (see vitest.config.ts).
const dataDir = resolve(process.cwd(), 'src/data')
const VALID_OPTION_IDS = ['A', 'B', 'C', 'D']

describe('questions.json integrity', () => {
  it('contains 197 questions in 20 categories, matching meta', () => {
    expect(questions).toHaveLength(197)
    expect(quizData.meta.questionCount).toBe(197)
    expect(categories).toHaveLength(20)
  })

  it('has unique question IDs and catalogue numbers', () => {
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length)
    expect(new Set(questions.map((q) => q.number)).size).toBe(questions.length)
  })

  it('references only existing categories, with matching counts', () => {
    const ids = new Set(categories.map((c) => c.id))
    expect(ids.size).toBe(categories.length)
    for (const q of questions) expect(ids, q.id).toContain(q.categoryId)
    for (const c of categories) {
      expect(
        questions.filter((q) => q.categoryId === c.id),
        c.name,
      ).toHaveLength(c.questionCount)
    }
  })

  it('has unique, valid option IDs per question', () => {
    for (const q of questions) {
      const optionIds = q.options.map((o) => o.id)
      expect(new Set(optionIds).size, q.id).toBe(optionIds.length)
      for (const id of optionIds) expect(VALID_OPTION_IDS, q.id).toContain(id)
    }
  })

  it('has correctAnswers as a non-empty subset of the option IDs', () => {
    for (const q of questions) {
      const optionIds = q.options.map((o) => o.id)
      expect(q.correctAnswers.length, q.id).toBeGreaterThan(0)
      for (const id of q.correctAnswers) expect(optionIds, q.id).toContain(id)
    }
  })

  it('has correct flags and multipleCorrect consistent with correctAnswers', () => {
    for (const q of questions) {
      const flagged = q.options.filter((o) => o.correct).map((o) => o.id)
      expect([...flagged].sort(), q.id).toEqual([...q.correctAnswers].sort())
      expect(q.multipleCorrect, q.id).toBe(q.correctAnswers.length > 1)
    }
  })

  it('matches the documented facts about the catalogue', () => {
    expect(questions.filter((q) => q.multipleCorrect)).toHaveLength(154)
    expect(questions.filter((q) => q.correctAnswers.length === 4)).toHaveLength(11)
    expect(questions.find((q) => q.number === 118)?.options.map((o) => o.id)).toEqual(['A', 'B'])
  })

  it('has images only in category 1, and every image file exists', () => {
    const withImage = questions.filter((q) => q.image !== null)
    expect(withImage).toHaveLength(7)
    for (const q of withImage) {
      expect(q.categoryId, q.id).toBe(1)
      expect(existsSync(resolve(dataDir, q.image!.src)), q.image!.src).toBe(true)
      expect(q.image!.width, q.id).toBeGreaterThan(0)
      expect(q.image!.height, q.id).toBeGreaterThan(0)
    }
  })

  it('resolves image URLs into the images folder', () => {
    expect(questionImageUrl('images/frage-006.png')).toMatch(/\/images\/frage-006\.png$/)
  })
})
