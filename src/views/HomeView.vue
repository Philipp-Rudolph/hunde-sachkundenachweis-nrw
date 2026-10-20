<script setup lang="ts">
import { quizData } from '@/data'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
</script>

<template>
  <section class="home">
    <h1>Sachkunde Hund NRW üben</h1>
    <p class="home__intro">
      {{ quizData.meta.questionCount }} offizielle Fragen in {{ quizData.categories.length }}
      Kategorien. Bei jeder Frage können eine oder mehrere Antworten richtig sein.
    </p>

    <nav class="modes" aria-label="Lernmodi">
      <RouterLink :to="{ name: 'categories' }" class="mode">
        <span class="mode__title">Kategorie üben</span>
        <span class="mode__desc">Alle Fragen einer Kategorie durcharbeiten</span>
      </RouterLink>
    </nav>

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

.modes {
  display: grid;
  gap: var(--space-3);
  margin: var(--space-6) 0;
}

.mode {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  box-shadow: var(--shadow);
  color: var(--color-text);
  text-decoration: none;
}

.mode:hover {
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

.settings h2 {
  font-size: 1.125rem;
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
