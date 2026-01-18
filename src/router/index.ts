import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import MainTimeline from '../views/MainTimeline.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/timeline',
  },
  {
    path: '/timeline',
    name: 'Timeline',
    component: MainTimeline,
  },
  {
    path: '/item/:id?',
    name: 'ItemDetail',
    component: () => import('../views/ItemDetail.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
