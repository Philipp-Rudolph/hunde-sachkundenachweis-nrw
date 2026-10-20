// Exam simulation parameters.
// These are placeholders for practice only. The official NRW values have not been verified,
// so none of these numbers may be presented as official.

export interface ExamConfig {
  /** Number of questions drawn per exam. */
  questionCount: number
  /** Minimum share of correct answers to pass, in [0, 1]. */
  passRatio: number
  /** Time limit when the timer is enabled. */
  timeLimitMinutes: number
}

export const EXAM_CONFIG: ExamConfig = {
  questionCount: 30, // TODO: verifizieren
  passRatio: 0.8, // TODO: verifizieren
  timeLimitMinutes: 45, // TODO: verifizieren
}
