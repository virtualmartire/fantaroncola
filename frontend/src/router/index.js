import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LandingView,
    },
    {
      path: '/regolamento',
      name: 'regolamento',
      component: () => import('../views/RegolamentoView.vue'),
    },
    {
      path: '/contatti',
      name: 'contatti',
      component: () => import('../views/ContattiView.vue'),
    },
    {
      path: '/accedi',
      name: 'auth',
      component: HomeView,
      meta: { requiresGuest: true },
    },
    {
      path: '/team',
      name: 'team',
      component: () => import('../views/TeamView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: () => import('../views/LeaderboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/punteggi-cantanti',
      name: 'singer-scores',
      component: () => import('../views/SingerScoresView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'fallback',
      component: LandingView,
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.hasInitialized) {
    await authStore.initializeAuth()
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return { name: 'team' }
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'auth' }
  }

  if (to.meta.requiresAdmin && !authStore.user?.is_admin) {
    return { name: 'home' }
  }

  return true
})

export default router
