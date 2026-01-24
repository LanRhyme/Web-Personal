<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';

const isMobileMenuOpen = ref(false);
const isDark = ref(false);
const route = useRoute();
const navRef = ref<HTMLElement | null>(null);
const trackerRef = ref<HTMLElement | null>(null);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
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
  <header class="w-full py-4 px-6 flex justify-center items-center sticky top-4 z-20">
    <div 
      class="container mx-auto header-card p-2 transition-all duration-300"
      :class="{ 'is-open': isMobileMenuOpen }"
    >
      <div class="flex items-center justify-between w-full lg:w-auto">
        <div class="flex items-center">
          <img alt="LanRhyme Logo" class="h-10 w-10 rounded-full ml-3 mr-3 object-cover" src="/img/avatar.jpg">
          <h1 class="text-2xl font-bold">LanRhyme</h1>
        </div>
        <button 
          class="lg:hidden text-xl p-2 rounded-md mr-2" 
          id="mobile-menu-button"
          @click="toggleMobileMenu"
        >
          <i class="fa fa-bars"></i>
        </button>
      </div>

      <nav class="nav w-full lg:w-auto" :class="{ 'hidden lg:flex': !isMobileMenuOpen, 'flex': isMobileMenuOpen }" ref="navRef">
        <div class="tracker" id="tracker" ref="trackerRef"></div>
        <router-link to="/" class="nav-item" active-class="active">
          <span class="nav-item-content">
            <i class="fa fa-home icon"></i>
            <span>主页</span>
          </span>
        </router-link>
        <router-link to="/projects" class="nav-item" active-class="active">
          <span class="nav-item-content">
            <i class="fa fa-user icon"></i>
            <span>项目</span>
          </span>
        </router-link>
        <router-link to="/commissions" class="nav-item" active-class="active">
          <span class="nav-item-content">
            <i class="fa-solid fa-pencil icon"></i>
            <span>约稿</span>
          </span>
        </router-link>
        <router-link to="/works" class="nav-item" active-class="active">
          <span class="nav-item-content">
            <i class="fa-solid fa-image icon"></i>
            <span>作品</span>
          </span>
        </router-link>
        <router-link to="/github" class="nav-item" active-class="active">
          <span class="nav-item-content">
            <i class="fab fa-github icon"></i>
            <span>GitHub</span>
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
      
      <!-- Mobile Theme Toggle -->
      <div 
        v-if="isMobileMenuOpen"
        class="lg:hidden flex items-center justify-center w-10 h-10 cursor-pointer transition-transform duration-300 hover:scale-110 mx-auto mt-4 rounded-full bg-card-bg border border-card-border"
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
