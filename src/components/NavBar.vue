<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';

const isMobileMenuOpen = ref(false);
const isDark = ref(false);
const route = useRoute();
const navRef = ref<HTMLElement | null>(null);
const trackerRef = ref<HTMLElement | null>(null);

const navItems = [
  { path: '/', name: '主页', icon: 'fa fa-home' },
  { path: '/projects', name: '项目', icon: 'fa fa-user' },
  { path: '/commissions', name: '约稿', icon: 'fa-solid fa-pencil' },
  { path: '/works', name: '作品', icon: 'fa-solid fa-image' },
  { path: '/github', name: 'GitHub', icon: 'fab fa-github' }
];

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  // Prevent scrolling when menu is open
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
  document.body.style.overflow = '';
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const updateTracker = () => {
  if (!navRef.value || !trackerRef.value) return;

  // Only update tracker if we are on desktop and nav is visible
  if (window.innerWidth < 1024) return;

  const activeItem = navRef.value.querySelector('.nav-item.active') as HTMLElement;
  
  if (activeItem) {
    trackerRef.value.style.width = `${activeItem.offsetWidth}px`;
    trackerRef.value.style.height = `${activeItem.offsetHeight}px`;
    trackerRef.value.style.transform = `translate(${activeItem.offsetLeft}px, ${activeItem.offsetTop}px)`;
    trackerRef.value.style.opacity = '1';
  } else {
    trackerRef.value.style.opacity = '0';
  }
};

onMounted(() => {
  // Check system preference for dark mode
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      isDark.value = true;
      document.documentElement.classList.add('dark');
  }

  // Initial tracker update
  nextTick(() => {
      updateTracker();
      // Additional delay to ensure fonts/layout are stable
      setTimeout(updateTracker, 100);
  });

  window.addEventListener('resize', updateTracker);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateTracker);
  document.body.style.overflow = ''; // Ensure scroll is restored
});

watch(
  () => route.path,
  () => {
    nextTick(() => {
      updateTracker();
    });
  }
);
</script>

<template>
  <!-- Mobile Menu Overlay -->
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div 
      v-if="isMobileMenuOpen" 
      class="fixed inset-0 z-40 bg-white/90 dark:bg-[#121212]/90 backdrop-blur-xl flex flex-col justify-center items-center lg:hidden"
      @click.self="closeMobileMenu"
    >
      <div class="flex flex-col space-y-6 text-center w-full px-8">
        <router-link 
          v-for="item in navItems" 
          :key="item.path"
          :to="item.path" 
          class="text-2xl font-bold text-gray-800 dark:text-gray-200 hover:text-[rgb(var(--jelly-green-rgb))] transition-colors py-2 hover:drop-shadow-[0_0_8px_rgba(var(--jelly-green-rgb),0.5)]"
          active-class="text-[rgb(var(--jelly-green-rgb))] drop-shadow-[0_0_8px_rgba(var(--jelly-green-rgb),0.5)]"
          @click="closeMobileMenu"
        >
          <i :class="`${item.icon} mr-3`"></i>
          {{ item.name }}
        </router-link>
      </div>
    </div>
  </transition>

  <header class="w-full py-4 px-6 flex justify-center items-center sticky top-4 z-50">
    <div 
      class="container mx-auto header-card p-2 transition-all duration-300 relative z-50"
      :class="{ 'bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md': !isMobileMenuOpen, 'bg-transparent border-transparent shadow-none': isMobileMenuOpen }"
    >
      <div class="flex items-center justify-between w-full lg:w-auto">
        <div class="flex items-center">
          <img alt="LanRhyme Logo" class="h-10 w-10 rounded-full ml-3 mr-3 object-cover" src="/img/avatar.jpg">
          <h1 class="text-2xl font-bold text-text-primary">LanRhyme</h1>
        </div>
        
        <!-- Mobile Theme Toggle & Menu Button -->
        <div class="flex items-center lg:hidden">
          <div 
            class="flex items-center justify-center w-10 h-10 cursor-pointer transition-transform duration-300 active:scale-95 mr-2 text-text-primary"
            @click="toggleTheme"
          >
            <i class="fa text-xl" :class="isDark ? 'fa-moon' : 'fa-sun'"></i>
          </div>
          <button 
            class="text-xl p-2 rounded-md mr-2 focus:outline-none transition-colors"
            :class="isMobileMenuOpen ? 'text-gray-800 dark:text-gray-200 bg-gray-200/50 dark:bg-gray-700/50' : ''"
            id="mobile-menu-button"
            @click="toggleMobileMenu"
          >
            <i class="fa" :class="isMobileMenuOpen ? 'fa-times' : 'fa-bars'"></i>
          </button>
        </div>
      </div>

      <!-- Desktop Nav -->
      <nav class="nav w-full lg:w-auto mt-2 lg:mt-0 hidden lg:flex" ref="navRef">
        <div class="tracker hidden lg:block" id="tracker" ref="trackerRef"></div>
        <router-link 
          v-for="item in navItems"
          :key="item.path"
          :to="item.path" 
          class="nav-item" 
          active-class="active"
        >
          <span class="nav-item-content">
            <i :class="`${item.icon} icon`"></i>
            <span>{{ item.name }}</span>
          </span>
        </router-link>
      </nav>

      <div 
        id="theme-toggle" 
        class="hidden lg:flex items-center justify-center w-10 h-10 cursor-pointer transition-transform duration-300 hover:scale-110 ml-5 rounded-full bg-card-bg border border-card-border"
        @click="toggleTheme"
      >
        <i class="fa" :class="isDark ? 'fa-moon' : 'fa-sun'"></i>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Scoped styles specific to NavBar if needed, but most are global in style.css */
/* Re-implementing specific scoped styles that might be needed */
</style>
