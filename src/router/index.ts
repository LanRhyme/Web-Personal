import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Projects from '../views/Projects.vue';
import Works from '../views/Works.vue';
import Commissions from '../views/Commissions.vue';
import Github from '../views/Github.vue';
import Admin from '../views/Admin.vue';
import Games from '../views/Games.vue';
import Articles from '../views/Articles.vue';
import ArticleDetail from '../views/ArticleDetail.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/projects', component: Projects },
  { path: '/works', component: Works },
  { path: '/commissions', component: Commissions },
  { path: '/github', component: Github },
  { path: '/games', component: Games },
  { path: '/admin', component: Admin },
  { path: '/articles', component: Articles },
  { path: '/article/:slug', component: ArticleDetail },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
