<script setup lang="ts">
import { useRouter } from 'vue-router'
import ProgressBar from '@/components/ProgressBar.vue'
import { quizData } from '@/data'
import { RANDOM_SESSION_SIZES } from '@/lib/sessionBuilder'
import { useProgressStore } from '@/stores/progress'
import { useQuizStore } from '@/stores/quiz'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const settings = useSettingsStore()
const progress = useProgressStore()
const quiz = useQuizStore()

function startRandom() {
  if (quiz.startRandom()) router.push({ name: 'quiz' })
}

function startMistakes() {
  if (quiz.startMistakes()) router.push({ name: 'quiz' })
}
</script>

<template>
  <section class="home">
    <h1>Sachkunde Hund NRW üben</h1>
    <p class="home__intro">
      {{ quizData.meta.questionCount }} offizielle Fragen in {{ quizData.categories.length }}
      Kategorien. Bei jeder Frage können eine oder mehrere Antworten richtig sein.
    </p>

    <section class="overall" aria-labelledby="overall-heading">
      <h2 id="overall-heading" class="overall__heading">Dein Fortschritt</h2>
      <p class="overall__text">
        {{ progress.overall.learned }} von {{ progress.overall.total }} Fragen gelernt
      </p>
      <ProgressBar
        :value="progress.overall.learned"
        :max="progress.overall.total"
        label="Gelernte Fragen insgesamt"
      />
      <RouterLink :to="{ name: 'stats' }" class="overall__link">Statistik ansehen</RouterLink>
    </section>

    <h2 class="modes__heading">Lernmodi</h2>
    <div class="modes">
      <RouterLink :to="{ name: 'categories' }" class="mode">
        <span class="mode__title">Kategorie üben</span>
        <span class="mode__desc">Alle Fragen einer Kategorie durcharbeiten</span>
      </RouterLink>

      <div class="mode">
        <span class="mode__title">Zufallstraining</span>
        <span class="mode__desc">Zufällige Fragen aus allen Kategorien</span>
        <fieldset class="mode__sizes">
          <legend class="visually-hidden">Anzahl Fragen</legend>
          <label v-for="size in RANDOM_SESSION_SIZES" :key="size" class="size">
            <input v-model="settings.randomCount" type="radio" name="random-count" :value="size" />
            <span>{{ size }}</span>
          </label>
        </fieldset>
        <button type="button" class="btn" @click="startRandom">
          {{ settings.randomCount }} Fragen starten
        </button>
      </div>

      <div class="mode">
        <span class="mode__title">Fehler wiederholen</span>
        <span class="mode__desc">
          <template v-if="progress.wrongIds.length > 0">
            {{ progress.wrongIds.length }}
            {{ progress.wrongIds.length === 1 ? 'Frage' : 'Fragen' }} zuletzt falsch beantwortet
          </template>
          <template v-else>Keine Fehler zum Wiederholen</template>
        </span>
        <button
          type="button"
          class="btn"
          :disabled="progress.wrongIds.length === 0"
          @click="startMistakes"
        >
          Fehler wiederholen
        </button>
      </div>
    </div>

    <section class="settings" aria-labelledby="settings-heading">
      <h2 id="settings-heading">Einstellungen</h2>
      <label class="settings__row">
        <input v-model="settings.shuffleQuestions" type="checkbox" />
        Fragen einer Kategorie mischen
      </label>
      <label class="settings__row">
        <input v-model="settings.shuffleOptions" type="checkbox" />
        Antworten in zufälliger Reihenfolge
      </label>
    </section>

    <p class="home__source">
      Fragenkatalog gültig ab {{ new Date(quizData.meta.validFrom).toLocaleDateString('de-DE') }}
    </p>
  </section>
</template>

<style scoped>
.home__intro {
  color: var(--color-text-muted);
}

.overall {
  display: grid;
  gap: var(--space-2);
  margin: var(--space-6) 0;
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}

.overall__heading {
  margin: 0;
  font-size: 1.125rem;
}

.overall__text {
  margin: 0;
}

.overall__link {
  justify-self: start;
  font-size: 0.875rem;
}

.modes__heading,
.settings h2 {
  font-size: 1.125rem;
}

.modes {
  display: grid;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.mode {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  box-shadow: var(--shadow);
  color: var(--color-text);
  text-decoration: none;
}

a.mode:hover {
  border-color: var(--color-primary);
}

.mode__title {
  font-weight: 600;
  font-size: 1.125rem;
}

.mode__desc {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.mode__sizes {
  display: flex;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  border: 0;
}

.size {
  flex: 1;
}

.size input {
  position: absolute;
  opacity: 0;
}

.size span {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
}

.size input:checked + span {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.size input:focus-visible + span {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.settings__row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 2.75rem;
}

.settings__row input {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--color-primary);
}

.home__source {
  margin-top: var(--space-8);
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
</style>
