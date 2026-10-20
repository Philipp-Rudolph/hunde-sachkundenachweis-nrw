import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { categories, questions as allQuestions } from '@/data'
import { evaluateOptions, isAnswerCorrect, scoreSession } from '@/lib/scoring'
import {
  arrangeOptions,
  buildCategorySession,
  buildMistakesSession,
  buildRandomSession,
  type DisplayedOption,
} from '@/lib/sessionBuilder'
import type { OptionId, Question } from '@/types/quiz'
import { useProgressStore } from './progress'
import { useSettingsStore } from './settings'

export type QuizMode = 'category' | 'random' | 'mistakes'

export interface SessionInfo {
  mode: QuizMode
  title: string
  categoryId?: number
}

export interface AnswerRecord {
  questionId: string
  selected: OptionId[]
  correct: boolean
}

export const useQuizStore = defineStore('quiz', () => {
  const settings = useSettingsStore()
  const progress = useProgressStore()

  const info = ref<SessionInfo | null>(null)
  const questions = ref<Question[]>([])
  const optionsByQuestion = ref<Record<string, DisplayedOption[]>>({})
  const currentIndex = ref(0)
  const selection = ref<OptionId[]>([])
  const answers = ref<AnswerRecord[]>([])
  const finished = ref(false)

  const hasSession = computed(() => info.value !== null && questions.value.length > 0)
  const total = computed(() => questions.value.length)
  const currentQuestion = computed(() => questions.value[currentIndex.value] ?? null)
  const currentOptions = computed(() =>
    currentQuestion.value ? (optionsByQuestion.value[currentQuestion.value.id] ?? []) : [],
  )
  const currentAnswer = computed(() =>
    answers.value.find((a) => a.questionId === currentQuestion.value?.id),
  )
  const isChecked = computed(() => currentAnswer.value !== undefined)
  const isLast = computed(() => currentIndex.value === total.value - 1)
  const canCheck = computed(() => !isChecked.value && selection.value.length > 0)
  const feedback = computed(() =>
    currentQuestion.value && currentAnswer.value
      ? evaluateOptions(currentQuestion.value, currentAnswer.value.selected)
      : null,
  )
  const score = computed(() => scoreSession(answers.value.map((a) => a.correct)))
  const wrongAnswers = computed(() => answers.value.filter((a) => !a.correct))

  function start(sessionInfo: SessionInfo, sessionQuestions: Question[]) {
    info.value = sessionInfo
    questions.value = sessionQuestions
    optionsByQuestion.value = Object.fromEntries(
      sessionQuestions.map((q) => [q.id, arrangeOptions(q, { shuffle: settings.shuffleOptions })]),
    )
    currentIndex.value = 0
    selection.value = []
    answers.value = []
    finished.value = false
  }

  /** Each start function returns false if there is nothing to play. */
  function startCategory(categoryId: number): boolean {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return false
    start(
      { mode: 'category', title: category.name, categoryId },
      buildCategorySession(allQuestions, categoryId, { shuffle: settings.shuffleQuestions }),
    )
    return true
  }

  function startRandom(count: number = settings.randomCount): boolean {
    start({ mode: 'random', title: 'Zufallstraining' }, buildRandomSession(allQuestions, count))
    return true
  }

  function startMistakes(): boolean {
    const session = buildMistakesSession(allQuestions, progress.wrongIds)
    if (session.length === 0) return false
    start({ mode: 'mistakes', title: 'Fehler wiederholen' }, session)
    return true
  }

  /** Starts a fresh session of the current mode. */
  function restart(): boolean {
    switch (info.value?.mode) {
      case 'category':
        return info.value.categoryId !== undefined && startCategory(info.value.categoryId)
      case 'random':
        return startRandom()
      case 'mistakes':
        return startMistakes()
      default:
        return false
    }
  }

  /** Restarts the session with only the questions answered wrong. */
  function repeatWrong() {
    if (!info.value) return
    const wrongIds = new Set(wrongAnswers.value.map((a) => a.questionId))
    start(
      info.value,
      questions.value.filter((q) => wrongIds.has(q.id)),
    )
  }

  function toggleOption(id: OptionId) {
    if (isChecked.value) return
    selection.value = selection.value.includes(id)
      ? selection.value.filter((s) => s !== id)
      : [...selection.value, id]
  }

  function check() {
    const question = currentQuestion.value
    if (!question || !canCheck.value) return
    const correct = isAnswerCorrect(question, selection.value)
    answers.value.push({ questionId: question.id, selected: [...selection.value], correct })
    progress.record(question.id, correct)
  }

  function next() {
    if (!isChecked.value) return
    if (isLast.value) {
      finished.value = true
      return
    }
    currentIndex.value++
    selection.value = []
  }

  return {
    info,
    questions,
    currentIndex,
    selection,
    answers,
    finished,
    hasSession,
    total,
    currentQuestion,
    currentOptions,
    currentAnswer,
    isChecked,
    isLast,
    canCheck,
    feedback,
    score,
    wrongAnswers,
    start,
    startCategory,
    startRandom,
    startMistakes,
    restart,
    repeatWrong,
    toggleOption,
    check,
    next,
  }
})
