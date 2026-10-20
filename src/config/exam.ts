// Exam simulation parameters.
// Question count and pass mark follow the official NRW exam as stated by the project owner
// (30 questions, at least 20 correct). The time limit is still an unverified placeholder.

export interface ExamConfig {
  /** Number of questions drawn per exam. */
  questionCount: number
  /** Minimum number of correct answers to pass. */
  passMinCorrect: number
  /** Time limit when the timer is enabled. */
  timeLimitMinutes: number
}

export const EXAM_CONFIG: ExamConfig = {
  questionCount: 30,
  passMinCorrect: 20,
  timeLimitMinutes: 45, // TODO: verifizieren
}
