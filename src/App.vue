<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const main = useTemplateRef<HTMLElement>('main')

// After client-side navigation, move focus to the new page heading so screen readers
// announce it. The initial page load keeps the browser's default focus.
watch(
  () => route.name,
  async (_, previous) => {
    if (previous === undefined) return
    await nextTick()
    const heading = main.value?.querySelector<HTMLElement>('h1')
    if (!heading) return
    heading.setAttribute('tabindex', '-1')
    heading.focus()
  },
)
</script>

<template>
  <a href="#main" class="skip-link">Zum Inhalt springen</a>
  <header class="app-header">
    <RouterLink :to="{ name: 'home' }" class="app-header__brand">Sachkunde-Quiz</RouterLink>
    <nav aria-label="Hauptnavigation" class="app-header__nav">
      <RouterLink :to="{ name: 'categories' }">Kategorien</RouterLink>
      <RouterLink :to="{ name: 'stats' }">Statistik</RouterLink>
    </nav>
  </header>
  <main id="main" ref="main" class="app-main" tabindex="-1">
    <RouterView />
  </main>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.app-header__brand {
  color: var(--color-text);
  font-weight: 700;
  text-decoration: none;
}

.app-header__nav {
  display: flex;
  gap: var(--space-4);
  font-size: 0.875rem;
}

.app-header__nav a {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
}

.app-header__nav a.router-link-exact-active {
  color: var(--color-text);
  font-weight: 600;
  text-decoration: none;
}

.app-main {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-6) var(--space-4) var(--space-8);
}
</style>
