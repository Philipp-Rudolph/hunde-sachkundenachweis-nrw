import { onMounted, onUnmounted } from 'vue'

const LETTER_KEYS = ['a', 'b', 'c', 'd']
const DIGIT_KEYS = ['1', '2', '3', '4']
const INTERACTIVE =
  'a, button, input, select, textarea, summary, [role="button"], [contenteditable]'

/**
 * Keyboard shortcuts for a question screen:
 * - A–D or 1–4 toggle the option shown with that letter/position
 * - Enter triggers the primary action unless focus is on an interactive element
 *   (buttons and options handle Enter themselves)
 */
export function useQuizKeyboard(handlers: {
  onToggleLabel: (label: string) => void
  onPrimary: () => void
}) {
  function onKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
    const target = event.target instanceof Element ? event.target : null
    if (target?.closest('[role="dialog"]')) return

    const key = event.key.toLowerCase()
    const index = LETTER_KEYS.includes(key) ? LETTER_KEYS.indexOf(key) : DIGIT_KEYS.indexOf(key)
    if (index >= 0) {
      if (target?.matches('input:not([type="checkbox"]):not([type="radio"]), textarea')) return
      event.preventDefault()
      handlers.onToggleLabel(LETTER_KEYS[index]!.toUpperCase())
      return
    }

    if (event.key === 'Enter' && !target?.closest(INTERACTIVE)) {
      event.preventDefault()
      handlers.onPrimary()
    }
  }

  onMounted(() => document.addEventListener('keydown', onKeydown))
  onUnmounted(() => document.removeEventListener('keydown', onKeydown))
}
