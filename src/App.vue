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
});
</script>

<template>
  <div class="app-root" :class="{ 'is-loaded': isLoaded }">
    <!-- Blurred Bubbles Background -->
    <BlurredBubbles />

    <!-- Main Content -->
    <div class="relative z-10 min-h-screen flex flex-col w-full">
      <NavBar v-if="!isAdmin" />

      <template v-if="isAdmin">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </template>

      <div 
        class="flex-grow w-full max-w-[1400px] mx-auto px-4 md:px-8 pb-12"
        :class="isHome ? 'pt-30' : 'pt-36'"
      >
        <div class="flex flex-col lg:flex-row items-start gap-8 lg:gap-10 relative">
          <MeCard v-if="!isHome && !isAdmin" class="w-full lg:w-[320px] lg:sticky lg:top-28 shrink-0 z-20" />
          <main class="flex-grow w-full z-10" :class="{ 'w-full': isHome, 'max-w-4xl': !isHome }">
            <router-view v-slot="{ Component }">
              <transition name="page-slide" mode="out-in">
                <keep-alive>
                    <component :is="Component" />
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
/* --- Premium Page Transitions --- */
.page-slide-enter-active,
.page-slide-leave-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(1.02);
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
