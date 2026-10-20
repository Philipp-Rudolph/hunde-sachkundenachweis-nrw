import type { AnswerOption, Question } from '@/types/quiz'
import { shuffle } from './shuffle'

export const RANDOM_SESSION_SIZES = [10, 20, 50] as const

export interface DisplayedOption extends AnswerOption {
  /** Letter shown in the UI for the current position; `id` stays the internal key. */
  label: string
}

const LABELS = ['A', 'B', 'C', 'D']

function byCatalogNumber(a: Question, b: Question): number {
  return a.number - b.number
}

/** All questions of a category, in catalogue order or shuffled. */
export function buildCategorySession(
  questions: readonly Question[],
  categoryId: number,
  options: { shuffle?: boolean; seed?: number } = {},
): Question[] {
  const selected = questions.filter((q) => q.categoryId === categoryId).sort(byCatalogNumber)
  return options.shuffle ? shuffle(selected, options.seed) : selected
}

/** `count` random questions across all categories (fewer if the pool is smaller). */
export function buildRandomSession(
  questions: readonly Question[],
  count: number,
  seed?: number,
): Question[] {
  return shuffle(questions, seed).slice(0, Math.max(0, count))
}

/** Questions whose IDs are in `wrongIds` (last answer was wrong), in catalogue order. */
export function buildMistakesSession(
  questions: readonly Question[],
  wrongIds: Iterable<string>,
): Question[] {
  const ids = new Set(wrongIds)
  return questions.filter((q) => ids.has(q.id)).sort(byCatalogNumber)
}

/** Options in display order with position-based letters. */
export function arrangeOptions(
  question: Question,
  options: { shuffle?: boolean; seed?: number } = {},
): DisplayedOption[] {
  const ordered = options.shuffle ? shuffle(question.options, options.seed) : [...question.options]
  return ordered.map((option, index) => ({ ...option, label: LABELS[index]! }))
}
