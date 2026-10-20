import type { Question } from '@/types/quiz'

export const HISTORY_LENGTH = 5
/** A question counts as learned once this many most recent attempts were correct. */
export const LEARNED_STREAK = 2

export interface QuestionStats {
  attempts: number
  correct: number
  lastResult: 'correct' | 'wrong' | null
  /** ISO timestamp of the last attempt. */
  lastSeen: string
  /** Most recent results, oldest first, at most HISTORY_LENGTH entries. */
  history: boolean[]
}

export type ProgressMap = Record<string, QuestionStats>

export interface ProgressSummary {
  learned: number
  total: number
  /** Share of learned questions in [0, 1]; 0 if total is 0. */
  ratio: number
}

export function recordAnswer(
  stats: QuestionStats | undefined,
  correct: boolean,
  now: Date,
): QuestionStats {
  const history = [...(stats?.history ?? []), correct].slice(-HISTORY_LENGTH)
  return {
    attempts: (stats?.attempts ?? 0) + 1,
    correct: (stats?.correct ?? 0) + (correct ? 1 : 0),
    lastResult: correct ? 'correct' : 'wrong',
    lastSeen: now.toISOString(),
    history,
  }
}

export function isLearned(stats: QuestionStats | undefined): boolean {
  if (!stats || stats.history.length < LEARNED_STREAK) return false
  return stats.history.slice(-LEARNED_STREAK).every(Boolean)
}

export function summarizeProgress(
  questions: readonly Question[],
  progress: ProgressMap,
): ProgressSummary {
  const learned = questions.filter((q) => isLearned(progress[q.id])).length
  const total = questions.length
  return { learned, total, ratio: total === 0 ? 0 : learned / total }
}

/** IDs of questions whose most recent answer was wrong. */
export function wrongQuestionIds(progress: ProgressMap): string[] {
  return Object.entries(progress)
    .filter(([, stats]) => stats.lastResult === 'wrong')
    .map(([id]) => id)
}

function isQuestionStats(value: unknown): value is QuestionStats {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return (
    Number.isInteger(s.attempts) &&
    Number.isInteger(s.correct) &&
    (s.lastResult === 'correct' || s.lastResult === 'wrong' || s.lastResult === null) &&
    typeof s.lastSeen === 'string' &&
    Array.isArray(s.history) &&
    s.history.every((h) => typeof h === 'boolean')
  )
}

/** Keeps valid entries of stored progress and drops malformed ones; null if not an object. */
export function parseProgress(data: unknown): ProgressMap | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null
  const result: ProgressMap = {}
  for (const [id, stats] of Object.entries(data)) {
    if (isQuestionStats(stats)) {
      result[id] = { ...stats, history: stats.history.slice(-HISTORY_LENGTH) }
    }
  }
  return result
}
