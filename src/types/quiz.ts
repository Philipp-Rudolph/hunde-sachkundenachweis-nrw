export type OptionId = 'A' | 'B' | 'C' | 'D'

export interface QuizMeta {
  title: string
  validFrom: string
  language: 'de'
  questionCount: number
  note: string
}

export interface Category {
  id: number
  name: string
  questionCount: number
}

export interface QuestionImage {
  /** Path relative to questions.json, e.g. "images/frage-006.png". */
  src: string
  width: number
  height: number
}

export interface AnswerOption {
  id: OptionId
  text: string
  correct: boolean
}

export interface Question {
  /** Stable ID ("q006"), key for persisted progress. */
  id: string
  /** Official catalogue number. */
  number: number
  categoryId: number
  question: string
  image: QuestionImage | null
  options: AnswerOption[]
  correctAnswers: OptionId[]
  multipleCorrect: boolean
}

export interface QuizData {
  meta: QuizMeta
  categories: Category[]
  questions: Question[]
}
