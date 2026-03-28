<script setup lang="ts">
import NavBar from './components/NavBar.vue';
import Footer from './components/Footer.vue';
import MeCard from './components/MeCard.vue';
import BlurredBubbles from './components/BlurredBubbles.vue';
import { onMounted, onUnmounted, ref, nextTick, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const isLoaded = ref(false);
const router = useRouter();
const route = useRoute();

const isHome = computed(() => route.path === '/');
const isAdmin = computed(() => route.path === '/admin');

let observer: IntersectionObserver;
let mutationObserver: MutationObserver;
let disableContextMenu: ((e: MouseEvent) => void) | null = null;

const initObserver = () => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.anim-fade-in-up').forEach(el => observer.observe(el));
};

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true;
  }, 300);

  // Disable right-click context menu
  disableContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };
  document.addEventListener('contextmenu', disableContextMenu);

  initObserver();

  mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.classList.contains('anim-fade-in-up')) {
            observer.observe(node);
          }
          node.querySelectorAll('.anim-fade-in-up').forEach(el => observer.observe(el));
        }
      });
    });
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  router.afterEach(() => {
    nextTick(() => {
      document.querySelectorAll('.anim-fade-in-up:not(.active)').forEach(el => observer.observe(el));
    });
  });
});

onUnmounted(() => {
  if (observer) observer.disconnect();
  if (mutationObserver) mutationObserver.disconnect();
  if (disableContextMenu) document.removeEventListener('contextmenu', disableContextMenu);
});
</script>

<template>
  <div class="app-root" :class="{ 'is-loaded': isLoaded }">
    <!-- Blurred Bubbles Background -->
    <BlurredBubbles />

    <!-- Main Content -->
    <div class="relative z-10 min-h-screen flex flex-col w-full">
      <NavBar v-if="!isAdmin" />

      <!-- Admin View (Standalone) -->
      <div v-if="isAdmin" class="flex-grow flex flex-col w-full h-full">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>

      <!-- Main Site View -->
      <div 
        v-else
        class="flex-grow w-full max-w-[1400px] mx-auto px-4 md:px-8 pb-12"
        :class="isHome ? 'pt-30' : 'pt-36'"
      >
        <div class="flex flex-col lg:flex-row items-start gap-8 lg:gap-10 relative">
          <MeCard v-if="!isHome" class="w-full lg:w-[320px] lg:sticky lg:top-28 shrink-0 z-20" />
          <main class="flex-grow w-full z-10" :class="{ 'w-full': isHome, 'max-w-4xl': !isHome }">
            <router-view v-slot="{ Component, route }">
              <transition name="page-slide" mode="out-in" appear>
                <keep-alive :max="10">
                    <component :is="Component" :key="route.name || route.path" />
                </keep-alive>
              </transition>
            </router-view>
          </main>
        </div>
      </div>

      <Footer v-if="!isAdmin" />
    </div>
  </div>
</template>

<style>
/* --- Layout Transitions --- */
.layout-transition {
  transition: padding 0.8s cubic-bezier(0.2, 1, 0.2, 1);
}

/* --- Premium Page Transitions --- */
.page-slide-enter-active,
.page-slide-leave-active {
  transition: all 0.7s cubic-bezier(0.2, 1, 0.2, 1);
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.96);
  filter: blur(8px);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(1.04);
  filter: blur(8px);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.app-root {
  opacity: 0;
  transition: opacity 0.6s ease;
}

.app-root.is-loaded {
  opacity: 1;
}
</style>
