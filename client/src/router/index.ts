import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import DashboardView from '../views/DashboardView.vue';
import GamesView from '../views/GamesView.vue';
import GameDetailView from '../views/GameDetailView.vue';
import CommunityView from '../views/CommunityView.vue';

export const routes = [
  {
    path: '/',
    name: 'home',
    redirect: () => {
      const authStore = useAuthStore();
      return authStore.isAuthenticated ? '/dashboard' : '/games';
    }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { guestOnly: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/games',
    name: 'games',
    component: GamesView
  },
  {
    path: '/games/:id',
    name: 'game-detail',
    component: GameDetailView
  },
  {
    path: '/games/:id/community',
    name: 'game-community',
    component: CommunityView
  }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' });
  } else if (to.meta.guestOnly && authStore.isAuthenticated) {
    next({ name: 'dashboard' });
  } else {
    next();
  }
});
