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

      <div v-else class="page-content w-full flex justify-center items-start p-8 box-border max-w-[1200px] mx-auto flex-wrap gap-8">
        <MeCard v-if="isHome" />
        <main class="right-content-area flex-grow max-w-[700px]">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
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

/* Ensure page-content layout matches legacy */
@media (max-width: 992px) {
  .page-content {
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    gap: 1.5rem;
  }
  .right-content-area {
    width: 100%;
    max-width: 100%;
    padding: 0;
  }
}
</style>
