import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { EXAM_CONFIG } from '@/config/exam'
import { useExamStore } from '@/stores/exam'
import { useProgressStore } from '@/stores/progress'
import { useSettingsStore } from '@/stores/settings'

describe('exam store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts with the configured number of distinct questions', () => {
    const exam = useExamStore()
    exam.start({ seed: 1 })
    expect(exam.inProgress).toBe(true)
    expect(exam.total).toBe(EXAM_CONFIG.questionCount)
    expect(new Set(exam.questions.map((q) => q.id)).size).toBe(EXAM_CONFIG.questionCount)
  })

  it('sets a deadline only when timed', () => {
    const exam = useExamStore()
    exam.start({ timed: true, now: 1_000 })
    expect(exam.deadline).toBe(1_000 + EXAM_CONFIG.timeLimitMinutes * 60_000)
    exam.start({ timed: false })
    expect(exam.deadline).toBeNull()
  })

  it('follows the timer setting by default', () => {
    useSettingsStore().examTimed = false
    const exam = useExamStore()
    exam.start()
    expect(exam.deadline).toBeNull()
  })

  it('keeps answers per question while navigating', () => {
    const exam = useExamStore()
    exam.start({ seed: 2 })
    exam.toggleOption('A')
    exam.toggleOption('B')
    exam.toggleOption('A')
    exam.next()
    exam.toggleOption('C')
    exam.previous()
    expect(exam.currentSelection).toEqual(['B'])
    expect(exam.answeredCount).toBe(2)
    expect(exam.unansweredCount).toBe(exam.total - 2)
  })

  it('stays within bounds when navigating', () => {
    const exam = useExamStore()
    exam.start({ seed: 3 })
    exam.previous()
    expect(exam.currentIndex).toBe(0)
    exam.goTo(exam.total - 1)
    exam.next()
    expect(exam.currentIndex).toBe(exam.total - 1)
  })

  it('flags and unflags the current question', () => {
    const exam = useExamStore()
    exam.start({ seed: 4 })
    exam.toggleFlag()
    expect(exam.isCurrentFlagged).toBe(true)
    expect(exam.flagged).toEqual([exam.currentQuestion!.id])
    exam.toggleFlag()
    expect(exam.flagged).toEqual([])
  })

  it('scores on submit, records progress for every question and locks the exam', () => {
    const exam = useExamStore()
    const progress = useProgressStore()
    exam.start({ seed: 5 })
    const first = exam.currentQuestion!
    for (const id of first.correctAnswers) exam.toggleOption(id)

    exam.submit()
    expect(exam.submitted).toBe(true)
    expect(exam.inProgress).toBe(false)
    expect(exam.result).toMatchObject({ correct: 1, total: exam.total, passed: false })
    expect(exam.result!.unanswered).toBe(exam.total - 1)
    expect(Object.keys(progress.stats)).toHaveLength(exam.total)
    expect(progress.stats[first.id]?.lastResult).toBe('correct')
    expect(progress.wrongIds).toHaveLength(exam.total - 1)

    exam.toggleOption('A')
    exam.submit()
    expect(progress.stats[first.id]?.attempts).toBe(1)
  })

  it('passes when enough answers are correct', () => {
    const exam = useExamStore()
    exam.start({ seed: 6 })
    for (let i = 0; i < exam.total; i++) {
      exam.goTo(i)
      for (const id of exam.currentQuestion!.correctAnswers) exam.toggleOption(id)
    }
    exam.submit()
    expect(exam.result).toMatchObject({ correct: exam.total, passed: true })
  })

  it('marks a timed-out submission', () => {
    const exam = useExamStore()
    exam.start({ seed: 7 })
    exam.submit({ timedOut: true })
    expect(exam.timedOut).toBe(true)
  })

  it('aborts without recording progress', () => {
    const exam = useExamStore()
    const progress = useProgressStore()
    exam.start({ seed: 8 })
    exam.toggleOption('A')
    exam.abort()
    expect(exam.inProgress).toBe(false)
    expect(exam.submitted).toBe(false)
    expect(progress.stats).toEqual({})
  })
})
