import type { Category, Question, QuizData } from '@/types/quiz'
import raw from './questions.json'

// questions.json is generated and never edited by hand; its shape is guarded by tests/data.spec.ts.
export const quizData = raw as QuizData

export const questions: readonly Question[] = quizData.questions
export const categories: readonly Category[] = quizData.categories

/**
 * Resolves an image `src` from questions.json ("images/frage-006.png") to a URL.
 * The static `./images/` prefix lets Vite include, hash and emit every image at build time.
 */
export function questionImageUrl(src: string): string {
  const fileName = src.replace(/^images\//, '')
  return new URL(`./images/${fileName}`, import.meta.url).href
}
