import type { OptionId, Question } from '@/types/quiz'

/**
 * Feedback state of a single option after checking:
 * - `correct-selected`: correct and selected
 * - `wrong-selected`: incorrect but selected
 * - `missed`: correct but not selected
 * - `neutral`: incorrect and not selected
 */
export type OptionFeedback = 'correct-selected' | 'wrong-selected' | 'missed' | 'neutral'

export interface SessionScore {
  correct: number
  total: number
  /** Share of correct answers in [0, 1]; 0 for an empty session. */
  ratio: number
}

/** A question counts as correct only if the selection equals `correctAnswers` exactly. */
export function isAnswerCorrect(question: Question, selected: readonly OptionId[]): boolean {
  const chosen = new Set(selected)
  const expected = new Set(question.correctAnswers)
  if (chosen.size !== expected.size) return false
  for (const id of chosen) {
    if (!expected.has(id)) return false
  }
  return true
}

export function evaluateOptions(
  question: Question,
  selected: readonly OptionId[],
): Record<OptionId, OptionFeedback> {
  const chosen = new Set(selected)
  const feedback = {} as Record<OptionId, OptionFeedback>
  for (const option of question.options) {
    const isSelected = chosen.has(option.id)
    if (option.correct) {
      feedback[option.id] = isSelected ? 'correct-selected' : 'missed'
    } else {
      feedback[option.id] = isSelected ? 'wrong-selected' : 'neutral'
    }
  }
  return feedback
}

export function scoreSession(results: readonly boolean[]): SessionScore {
  const correct = results.filter(Boolean).length
  const total = results.length
  return { correct, total, ratio: total === 0 ? 0 : correct / total }
}
