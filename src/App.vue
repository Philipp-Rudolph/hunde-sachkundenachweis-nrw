<template>
  <header class="app-header">
    <RouterLink :to="{ name: 'home' }" class="app-header__brand">Sachkunde-Quiz</RouterLink>
  </header>
  <main class="app-main">
    <RouterView />
  </main>
</template>

<style scoped>
.app-header {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.app-header__brand {
  color: var(--color-text);
  font-weight: 700;
  text-decoration: none;
}

.app-main {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-6) var(--space-4) var(--space-8);
}
</style>
