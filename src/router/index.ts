import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Projects from '../views/Projects.vue';
import Works from '../views/Works.vue';
import Tools from '../views/Tools.vue';
import Commissions from '../views/Commissions.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/projects', component: Projects },
  { path: '/works', component: Works },
  { path: '/tools', component: Tools },
  { path: '/commissions', component: Commissions },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
