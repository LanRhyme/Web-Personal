<script setup lang="ts">
import NavBar from './components/NavBar.vue';
import Footer from './components/Footer.vue';
import MeCard from './components/MeCard.vue';
import { onMounted, onUnmounted, ref, nextTick, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const isLoaded = ref(false);
const router = useRouter();
const route = useRoute();

const isHome = computed(() => route.path === '/');
const isAdmin = computed(() => route.path === '/admin');

let observer: IntersectionObserver;
let mutationObserver: MutationObserver;

const initObserver = () => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  // Initial check
  document.querySelectorAll('.anim-fade-in-up, .anim-fade-in-down').forEach(el => observer.observe(el));
};

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true;
  }, 500);

  initObserver();

  // Watch for DOM changes to handle dynamic content (routing)
  mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.classList.contains('anim-fade-in-up') || node.classList.contains('anim-fade-in-down')) {
            observer.observe(node);
          }
          // Check children
          node.querySelectorAll('.anim-fade-in-up, .anim-fade-in-down').forEach(el => observer.observe(el));
        }
      });
    });
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also hook into router changes as a backup
  router.afterEach(() => {
    nextTick(() => {
      document.querySelectorAll('.anim-fade-in-up:not(.active), .anim-fade-in-down:not(.active)').forEach(el => observer.observe(el));
    });
  });
});

onUnmounted(() => {
  if (observer) observer.disconnect();
  if (mutationObserver) mutationObserver.disconnect();
});
</script>

<template>
  <div class="app-container" :class="{ 'content-loaded': isLoaded }">
    <!-- Loader -->
    <div id="page-loader" :class="{ 'hidden': isLoaded }">
      <div class="butterfly-loader">
        <div class="butterfly" style="top: 20%; left: 10%;"></div>
        <div class="butterfly" style="top: 60%; left: 70%;"></div>
        <div class="butterfly" style="top: 40%; left: 40%;"></div>
      </div>
    </div>

    <!-- Ambient Jelly Lighting -->
    <div class="ambient-light light-1"></div>
    <div class="ambient-light light-2"></div>
    <div class="ambient-light light-3"></div>

    <!-- Main Content -->
    <div class="min-h-screen flex flex-col items-center relative z-10 w-full">
      <NavBar v-if="!isAdmin" />

      <template v-if="isAdmin">
         <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
      </template>

      <div v-else class="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 lg:py-16">
        <div class="flex flex-col lg:flex-row justify-center items-start gap-8 lg:gap-16 relative">
          <MeCard v-if="isHome" class="w-full lg:w-[380px] lg:sticky lg:top-32 shrink-0 z-20" />
          <main class="flex-grow w-full z-10" :class="{ 'max-w-4xl': isHome, 'max-w-6xl': !isHome }">
            <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </main>
        </div>
      </div>

      <Footer v-if="!isAdmin" />
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Butterfly Loader Styles (Copied from legacy if needed, or simple placeholder) */
.butterfly-loader {
  position: relative;
  width: 100%;
  height: 100%;
}
.butterfly {
  position: absolute;
  width: 20px;
  height: 20px;
  background: var(--amethyst-color);
  border-radius: 50%;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.8); opacity: 0.5; }
}

/* Layout relies purely on flex utility classes instead of manual media query */
</style>
