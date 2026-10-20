import { createRouter, createWebHistory } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'
import CategoriesView from '@/views/CategoriesView.vue'
import HomeView from '@/views/HomeView.vue'
import QuizView from '@/views/QuizView.vue'
import ResultView from '@/views/ResultView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/kategorien', name: 'categories', component: CategoriesView },
    {
      path: '/quiz',
      name: 'quiz',
      component: QuizView,
      // The session lives in memory only; without one (e.g. after a reload) go home.
      beforeEnter: () => (useQuizStore().hasSession ? true : { name: 'home' }),
    },
    {
      path: '/ergebnis',
      name: 'result',
      component: ResultView,
      beforeEnter: () => (useQuizStore().finished ? true : { name: 'home' }),
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
