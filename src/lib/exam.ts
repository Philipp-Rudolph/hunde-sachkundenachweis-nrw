import type { OptionId, Question } from '@/types/quiz'
import { isAnswerCorrect } from './scoring'

export interface ExamQuestionResult {
  questionId: string
  categoryId: number
  selected: OptionId[]
  answered: boolean
  correct: boolean
}

export interface CategoryResult {
  categoryId: number
  correct: number
  total: number
}

export interface ExamResult {
  correct: number
  total: number
  /** Share of correct answers in [0, 1]; 0 for an empty exam. */
  ratio: number
  passed: boolean
  unanswered: number
  questions: ExamQuestionResult[]
  /** Per-category results, sorted by category ID. */
  byCategory: CategoryResult[]
}

export function isPassed(correct: number, passMinCorrect: number): boolean {
  return correct >= passMinCorrect
}

/** Scores an exam. Unanswered questions count as wrong. */
export function evaluateExam(
  questions: readonly Question[],
  answers: Readonly<Record<string, readonly OptionId[]>>,
  passMinCorrect: number,
): ExamResult {
  const results = questions.map((q): ExamQuestionResult => {
    const selected = [...(answers[q.id] ?? [])]
    const answered = selected.length > 0
    return {
      questionId: q.id,
      categoryId: q.categoryId,
      selected,
      answered,
      correct: answered && isAnswerCorrect(q, selected),
    }
  })

  const categories = new Map<number, CategoryResult>()
  for (const r of results) {
    const entry = categories.get(r.categoryId) ?? { categoryId: r.categoryId, correct: 0, total: 0 }
    entry.total++
    if (r.correct) entry.correct++
    categories.set(r.categoryId, entry)
  }

  const correct = results.filter((r) => r.correct).length
  const total = results.length
  return {
    correct,
    total,
    ratio: total === 0 ? 0 : correct / total,
    passed: isPassed(correct, passMinCorrect),
    unanswered: results.filter((r) => !r.answered).length,
    questions: results,
    byCategory: [...categories.values()].sort((a, b) => a.categoryId - b.categoryId),
  }
}

/** Whole seconds left until `deadline` (epoch ms), never negative. */
export function remainingSeconds(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000))
}

/** Formats seconds as m:ss (e.g. 45:00, 0:09). */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
