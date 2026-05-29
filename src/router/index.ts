import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../views/Home.vue';

// 懒加载页面组件
const Projects = () => import('../views/Projects.vue');
const Works = () => import('../views/Works.vue');
const Commissions = () => import('../views/Commissions.vue');
const Github = () => import('../views/Github.vue');
const Admin = () => import('../views/Admin.vue');
const Games = () => import('../views/Games.vue');
const Articles = () => import('../views/Articles.vue');
const ArticleDetail = () => import('../views/ArticleDetail.vue');
const TerminalView = () => import('../views/TerminalView.vue');
const PhysicalView = () => import('../views/PhysicalView.vue');

// 预加载其他页面，仅在 Wi-Fi 或良好网络环境下触发
export const preloadOtherPages = () => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  let shouldPreload = false;

  if (connection) {
    // 开启省流量模式则取消预加载
    if (connection.saveData) {
      return;
    }
    // 如果明确为 wifi，或在不支持 type 时通过 effectiveType 判定为 4g (包含桌面宽带环境)
    if (connection.type === 'wifi' || connection.effectiveType === '4g') {
      shouldPreload = true;
    }
  } else {
    // 如果不支持网络状态 API，默认进行预加载
    shouldPreload = true;
  }

  if (shouldPreload) {
    const componentsToPreload = [
      Projects, Works, Commissions, Github, Admin, Games, Articles, ArticleDetail, TerminalView, PhysicalView
    ];

    const load = () => {
      componentsToPreload.forEach(importFn => {
        importFn().catch(() => {});
      });
    };

    // 优先使用 requestIdleCallback 在浏览器空闲时加载，不影响主流程渲染
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => load());
    } else {
      setTimeout(load, 2000);
    }
  }
};

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
  { path: '/void-echo-terminal', component: TerminalView },
  { path: '/physical', component: PhysicalView },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
