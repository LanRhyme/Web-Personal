import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../views/Home.vue';

// 懒加载页面组件
const Projects = () => import('../views/Projects.vue');
const Works = () => import('../views/Works.vue');
const Commissions = () => import('../views/Commissions.vue');
const Admin = () => import('../views/Admin.vue');
const Games = () => import('../views/Games.vue');
const Articles = () => import('../views/Articles.vue');
const ArticleDetail = () => import('../views/ArticleDetail.vue');
const TerminalView = () => import('../views/TerminalView.vue');
const PhysicalView = () => import('../views/PhysicalView.vue');
const WorldviewPortal = () => import('../views/WorldviewPortal.vue');
const Worldview = () => import('../views/Worldview.vue');
const WorldviewCloud = () => import('../views/WorldviewCloud.vue');
const NotFound = () => import('../views/NotFound.vue');

// 预加载其他页面，仅在 Wi-Fi 或良好网络环境下触发
export const preloadOtherPages = () => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  let shouldPreload = false;

  if (connection) {
    if (connection.saveData) {
      return;
    }
    if (connection.type === 'wifi' || connection.effectiveType === '4g') {
      shouldPreload = true;
    }
  } else {
    shouldPreload = true;
  }

  if (shouldPreload) {
    // Only preload the most likely next pages in priority order
    const priorityComponents = [Projects, Works, Articles];

    const load = () => {
      // Stagger imports by 800ms so network queue isn't flooded
      priorityComponents.forEach((importFn, idx) => {
        setTimeout(() => {
          importFn().catch(() => {});
        }, idx * 800);
      });
    };

    // Delay preloading by 3.5s so initial home page load, styles, and hero assets settle first
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        setTimeout(load, 3500);
      });
    } else {
      setTimeout(load, 4500);
    }
  }
};

const routes = [
  { path: '/', component: Home },
  { path: '/projects', component: Projects },
  { path: '/works', component: Works },
  { path: '/commissions', component: Commissions },
  { path: '/games', component: Games },
  { path: '/admin', component: Admin },
  { path: '/articles', component: Articles },
  { path: '/article/:slug', component: ArticleDetail },
  { path: '/void-echo-terminal', component: TerminalView },
  { path: '/physical', component: PhysicalView },
  { path: '/worldview', component: WorldviewPortal },
  { path: '/worldview/core', component: Worldview },
  { path: '/worldview/cloud', component: WorldviewCloud },
  { path: '/:pathMatch(.*)*', component: NotFound },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
