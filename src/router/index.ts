import { createRouter, createWebHistory } from 'vue-router'
import { useExamStore } from '@/stores/exam'
import { useQuizStore } from '@/stores/quiz'
import CategoriesView from '@/views/CategoriesView.vue'
import ExamResultView from '@/views/ExamResultView.vue'
import ExamView from '@/views/ExamView.vue'
import HomeView from '@/views/HomeView.vue'
import QuizView from '@/views/QuizView.vue'
import ResultView from '@/views/ResultView.vue'
import StatsView from '@/views/StatsView.vue'

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
    {
      path: '/pruefung',
      name: 'exam',
      component: ExamView,
      beforeEnter: () => (useExamStore().inProgress ? true : { name: 'home' }),
    },
    {
      path: '/pruefung/ergebnis',
      name: 'exam-result',
      component: ExamResultView,
      beforeEnter: () => (useExamStore().submitted ? true : { name: 'home' }),
    },
    { path: '/statistik', name: 'stats', component: StatsView },
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
