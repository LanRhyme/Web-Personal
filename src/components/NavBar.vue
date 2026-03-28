<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const navRef = ref<HTMLElement | null>(null);
const trackerRef = ref<HTMLElement | null>(null);
const isMobileMenuOpen = ref(false);
const isScrolled = ref(false);
const isDark = ref(localStorage.getItem('theme') === 'dark');

const toggleDarkMode = () => {
    isDark.value = !isDark.value;
    if (isDark.value) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
};

const navItems = [
  { path: '/', name: '主页', icon: 'fa fa-home' },
  { path: '/projects', name: '项目', icon: 'fa fa-cube' },
  { path: '/commissions', name: '约稿', icon: 'fa-solid fa-pencil' },
  { path: '/works', name: '作品', icon: 'fa-solid fa-image' },
  { path: '/games', name: '游戏', icon: 'fa-solid fa-gamepad' },
  { path: '/github', name: 'GitHub', icon: 'fab fa-github' }
];

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  document.body.style.overflow = isMobileMenuOpen.value ? 'hidden' : '';
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
  document.body.style.overflow = '';
};

const updateTracker = () => {
  if (!navRef.value || !trackerRef.value) return;
  if (window.innerWidth < 1024) return;

  const activeItem = navRef.value.querySelector('.nav-link.active') as HTMLElement;
  if (activeItem) {
    trackerRef.value.style.width = `${activeItem.offsetWidth}px`;
    trackerRef.value.style.height = `${activeItem.offsetHeight}px`;
    trackerRef.value.style.transform = `translate(${activeItem.offsetLeft}px, ${activeItem.offsetTop}px)`;
    trackerRef.value.style.opacity = '1';
  } else {
    trackerRef.value.style.opacity = '0';
  }
};

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

onMounted(() => {
  if (isDark.value) {
    document.documentElement.classList.add('dark');
  }

  nextTick(() => {
    updateTracker();
    setTimeout(updateTracker, 150);
  });

  window.addEventListener('resize', updateTracker);
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('resize', updateTracker);
  window.removeEventListener('scroll', handleScroll);
  document.body.style.overflow = '';
});

watch(() => route.path, () => {
  nextTick(updateTracker);
});
</script>

<template>
  <!-- Mobile Menu Overlay -->
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 z-40 backdrop-blur-2xl flex flex-col justify-center items-center lg:hidden"
      style="background: rgba(238, 238, 238, 0.92)"
      @click.self="closeMobileMenu"
    >
      <div class="flex flex-col space-y-3 text-center w-full px-8 max-w-xs mx-auto">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="card-flat flex items-center gap-4 px-6 py-4 text-lg font-semibold transition-all duration-300"
          :class="route.path === item.path ? 'text-[#35bfa0] border-[rgba(53,191,160,0.3)]' : 'text-[#2d4a3e]'"
          active-class=""
          @click="closeMobileMenu"
        >
          <i :class="item.icon" class="w-6 text-center"></i>
          {{ item.name }}
        </router-link>
      </div>
    </div>
  </transition>

  <header class="w-full py-4 px-4 md:px-6 flex justify-center sticky top-0 z-50">
    <div
      class="nav-card w-full max-w-[720px] px-3 py-2 flex items-center justify-between transition-all duration-500"
      :class="{ 'shadow-lg': isScrolled }"
    >
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-3 shrink-0 text-decoration-none">
        <img
          alt="LanRhyme"
          src="/img/avatar.jpg"
          class="h-9 w-9 rounded-full object-cover"
          style="box-shadow: 0 8px 16px -4px rgba(139, 118, 106, 0.25)"
        >
        <span class="text-lg font-bold text-[#2d4a3e] hidden sm:inline">LanRhyme</span>
      </router-link>

      <!-- Desktop Nav -->
      <nav class="hidden lg:flex items-center relative py-1" ref="navRef">
        <div class="nav-tracker" ref="trackerRef" style="opacity: 0"></div>
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          active-class="active"
        >
          <i :class="item.icon" class="text-sm"></i>
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <!-- Right Actions -->
      <div class="flex items-center gap-2">
        <!-- Dark Mode Toggle -->
        <button
          @click="toggleDarkMode"
          class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-[rgba(53,191,160,0.1)] text-[#6b8a7a] hover:text-[#35bfa0]"
          :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
        >
          <transition name="fade" mode="out-in">
            <i v-if="isDark" class="fas fa-moon"></i>
            <i v-else class="fas fa-sun"></i>
          </transition>
        </button>

        <!-- Mobile Menu Toggle -->
        <button
          class="lg:hidden flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 text-[#2d4a3e]"
          :class="isMobileMenuOpen ? 'bg-[rgba(53,191,160,0.1)]' : ''"
          @click="toggleMobileMenu"
        >
          <i class="fa text-base" :class="isMobileMenuOpen ? 'fa-times' : 'fa-bars'"></i>
        </button>
      </div>
    </div>
  </header>
</template>
