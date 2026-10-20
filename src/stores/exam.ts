import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { EXAM_CONFIG, type ExamConfig } from '@/config/exam'
import { questions as allQuestions } from '@/data'
import { evaluateExam, type ExamResult } from '@/lib/exam'
import { arrangeOptions, buildRandomSession, type DisplayedOption } from '@/lib/sessionBuilder'
import type { OptionId, Question } from '@/types/quiz'
import { useProgressStore } from './progress'
import { useSettingsStore } from './settings'

export type QuestionStatus = 'answered' | 'open'

export const useExamStore = defineStore('exam', () => {
  const settings = useSettingsStore()
  const progress = useProgressStore()

  const config = ref<ExamConfig>(EXAM_CONFIG)
  const questions = ref<Question[]>([])
  const optionsByQuestion = ref<Record<string, DisplayedOption[]>>({})
  const answers = ref<Record<string, OptionId[]>>({})
  const flagged = ref<string[]>([])
  const currentIndex = ref(0)
  /** Epoch ms when time runs out; null without timer. */
  const deadline = ref<number | null>(null)
  const result = ref<ExamResult | null>(null)
  const timedOut = ref(false)

  const inProgress = computed(() => questions.value.length > 0 && result.value === null)
  const submitted = computed(() => result.value !== null)
  const total = computed(() => questions.value.length)
  const currentQuestion = computed(() => questions.value[currentIndex.value] ?? null)
  const currentOptions = computed(() =>
    currentQuestion.value ? (optionsByQuestion.value[currentQuestion.value.id] ?? []) : [],
  )
  const currentSelection = computed(() =>
    currentQuestion.value ? (answers.value[currentQuestion.value.id] ?? []) : [],
  )
  const isCurrentFlagged = computed(
    () => currentQuestion.value !== null && flagged.value.includes(currentQuestion.value.id),
  )
  const answeredCount = computed(
    () => questions.value.filter((q) => (answers.value[q.id]?.length ?? 0) > 0).length,
  )
  const unansweredCount = computed(() => total.value - answeredCount.value)

  function statusOf(questionId: string): QuestionStatus {
    return (answers.value[questionId]?.length ?? 0) > 0 ? 'answered' : 'open'
  }

  function isFlagged(questionId: string): boolean {
    return flagged.value.includes(questionId)
  }

  function start(options: { timed?: boolean; now?: number; seed?: number } = {}) {
    const timed = options.timed ?? settings.examTimed
    const now = options.now ?? Date.now()
    config.value = EXAM_CONFIG
    questions.value = buildRandomSession(allQuestions, config.value.questionCount, options.seed)
    optionsByQuestion.value = Object.fromEntries(
      questions.value.map((q) => [q.id, arrangeOptions(q, { shuffle: settings.shuffleOptions })]),
    )
    answers.value = {}
    flagged.value = []
    currentIndex.value = 0
    deadline.value = timed ? now + config.value.timeLimitMinutes * 60_000 : null
    result.value = null
    timedOut.value = false
  }

  function toggleOption(id: OptionId) {
    const question = currentQuestion.value
    if (!question || !inProgress.value) return
    const selected = answers.value[question.id] ?? []
    answers.value = {
      ...answers.value,
      [question.id]: selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id],
    }
  }

  function toggleFlag() {
    const question = currentQuestion.value
    if (!question || !inProgress.value) return
    flagged.value = isFlagged(question.id)
      ? flagged.value.filter((id) => id !== question.id)
      : [...flagged.value, question.id]
  }

  function goTo(index: number) {
    if (index >= 0 && index < total.value) currentIndex.value = index
  }

  function next() {
    goTo(currentIndex.value + 1)
  }

  function previous() {
    goTo(currentIndex.value - 1)
  }

  /** Scores the exam once and records every question in the progress statistics. */
  function submit(options: { timedOut?: boolean } = {}) {
    if (!inProgress.value) return
    const evaluated = evaluateExam(questions.value, answers.value, config.value.passMinCorrect)
    for (const r of evaluated.questions) progress.record(r.questionId, r.correct)
    timedOut.value = options.timedOut ?? false
    result.value = evaluated
  }

  /** Drops a running exam without scoring it. */
  function abort() {
    if (!inProgress.value) return
    questions.value = []
    answers.value = {}
    flagged.value = []
    deadline.value = null
  }

  return {
    config,
    questions,
    answers,
    flagged,
    currentIndex,
    deadline,
    result,
    timedOut,
    inProgress,
    submitted,
    total,
    currentQuestion,
    currentOptions,
    currentSelection,
    isCurrentFlagged,
    answeredCount,
    unansweredCount,
    statusOf,
    isFlagged,
    start,
    toggleOption,
    toggleFlag,
    goTo,
    next,
    previous,
    submit,
    abort,
  }
})
