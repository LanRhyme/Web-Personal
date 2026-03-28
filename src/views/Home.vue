<script setup lang="ts">
import pinnedItems from '../data/pinned-items.json';
import { ref, onMounted } from 'vue';

interface PinnedItem {
  title: string;
  description: string;
  link: string;
}

const items: PinnedItem[] = pinnedItems;

const roles = ["全栈开发者", "数字艺术家", "创意探索者"];
const currentRole = ref("");
const roleIndex = ref(0);
const charIndex = ref(0);
const isDeleting = ref(false);
const typingSpeed = ref(100);

const typeRole = () => {
  const current = roles[roleIndex.value] || "";
  
  if (isDeleting.value) {
    currentRole.value = current.substring(0, charIndex.value - 1);
    charIndex.value--;
    typingSpeed.value = 50;
  } else {
    currentRole.value = current.substring(0, charIndex.value + 1);
    charIndex.value++;
    typingSpeed.value = 150;
  }

  if (!isDeleting.value && charIndex.value === current.length) {
    isDeleting.value = true;
    typingSpeed.value = 2000; // Pause at end
  } else if (isDeleting.value && charIndex.value === 0) {
    isDeleting.value = false;
    roleIndex.value = (roleIndex.value + 1) % roles.length;
    typingSpeed.value = 500;
  }

  setTimeout(typeRole, typingSpeed.value);
};

onMounted(() => {
  setTimeout(typeRole, 1000);
});

const openLink = (link: string) => {
  if (link) {
    if (!link.startsWith('http')) {
        link = 'https://' + link;
    }
    window.open(link, '_blank');
  }
};
</script>

<template>
  <div class="right-content-area flex flex-col items-center w-full">
    <section class="py-12 lg:py-24 text-center w-full anim-fade-in-up relative overflow-visible" id="home" style="animation-delay: 0.1s;">
      <!-- Hero Content -->
      <div class="relative z-10">
        <h2 class="text-6xl font-black mb-6 tracking-tight">
            <span class="text-text-primary">Hello, I'm</span> 
            <span class="relative inline-block text-[rgb(var(--jelly-green-rgb))] drop-shadow-[0_0_15px_rgba(var(--jelly-green-rgb),0.5)]">LanRhyme</span>
        </h2>
        <div class="h-12 flex justify-center items-center">
             <p class="text-2xl text-gray-700 dark:text-gray-300 font-light">
                我是 <span class="font-bold text-[rgb(var(--jelly-green-rgb))] drop-shadow-[0_0_10px_rgba(var(--jelly-green-rgb),0.3)]">{{ currentRole }}</span><span class="cursor-blink">|</span>
             </p>
        </div>
        
        <div class="mt-12 flex justify-center gap-6 flex-wrap">
          <router-link to="/commissions" class="btn-glow-primary group px-8 py-3 font-bold">
            <span class="relative z-10 flex items-center">
                 <i class="fa-solid fa-pencil mr-2 group-hover:animate-bounce"></i> 约稿
            </span>
          </router-link>
          
          <router-link to="/works" class="btn-glass group px-8 py-3 font-bold">
             <span class="relative z-10 flex items-center">
                <i class="fa-solid fa-image mr-2 group-hover:rotate-12 transition-transform"></i> 作品
             </span>
          </router-link>

          <router-link to="/projects" class="btn-glass group px-8 py-3 font-bold">
             <span class="relative z-10 flex items-center">
                <i class="fa fa-user mr-2 group-hover:scale-110 transition-transform"></i> 项目
             </span>
          </router-link>
        </div>
      </div>
    </section>

    <section class="w-full mt-10 anim-fade-in-up" id="pinned-content" style="animation-delay: 0.2s;">
      <h3 class="text-3xl font-bold mb-8 text-center flex items-center justify-center">
        <span class="w-8 h-1 bg-[rgb(var(--jelly-green-rgb))] shadow-[0_0_10px_rgba(var(--jelly-green-rgb),0.5)] rounded-full mr-4"></span>
        精选置顶
        <span class="w-8 h-1 bg-[rgb(var(--jelly-green-rgb))] shadow-[0_0_10px_rgba(var(--jelly-green-rgb),0.5)] rounded-full ml-4"></span>
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
        <div 
          v-for="(item, index) in items" 
          :key="index"
          class="jelly-glass group p-8 cursor-pointer relative overflow-hidden"
          @click="openLink(item.link)"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-[rgba(var(--jelly-green-rgb),0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h4 class="text-xl font-bold mb-3 text-text-primary group-hover:text-[rgb(var(--jelly-green-rgb))] transition-colors relative z-10">{{ item.title }}</h4>
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed relative z-10">{{ item.description }}</p>
          <div class="mt-4 flex justify-end relative z-10">
             <i class="fa-solid fa-arrow-right text-gray-300 dark:text-gray-600 group-hover:text-[rgb(var(--jelly-green-rgb))] transform group-hover:translate-x-2 transition-all"></i>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.cursor-blink {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@media (max-width: 768px) {
  .text-6xl {
    font-size: 2.5rem;
    line-height: 1.2;
  }
  .text-3xl {
    font-size: 1.5rem;
  }
  .py-20 {
    padding-top: 3rem;
    padding-bottom: 3rem;
  }
  .mt-12 {
    margin-top: 2rem;
  }
  .gap-6 {
    gap: 1rem;
  }
  .btn-glow-primary, .btn-glass {
    padding: 0.5rem 1.5rem;
    font-size: 0.9rem;
  }
}
</style>
