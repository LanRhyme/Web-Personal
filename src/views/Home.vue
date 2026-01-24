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
    <section class="py-20 text-center w-full anim-fade-in-up relative overflow-hidden" id="home" style="animation-delay: 0.1s;">
      <!-- Hero Content -->
      <div class="relative z-10">
        <h2 class="text-6xl font-black mb-6 tracking-tight">
            <span class="text-text-primary">Hello, I'm</span> <span class="relative inline-block bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-teal-500 dark:from-green-400 dark:to-teal-300">LanRhyme</span>
        </h2>
        <div class="h-12 flex justify-center items-center">
             <p class="text-2xl text-gray-700 dark:text-gray-300 font-light">
                我是 <span class="font-bold text-green-600 dark:text-green-400">{{ currentRole }}</span><span class="cursor-blink">|</span>
             </p>
        </div>
        
        <div class="mt-12 flex justify-center gap-6 flex-wrap">
          <router-link to="/commissions" class="btn-glow-primary group relative px-8 py-3 rounded-full bg-green-600 text-white font-bold overflow-hidden transition-all hover:scale-105 hover:shadow-lg">
            <span class="relative z-10 flex items-center">
                 <i class="fa-solid fa-pencil mr-2"></i> 约稿
            </span>
            <div class="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 skew-x-12 -ml-4"></div>
          </router-link>
          
          <router-link to="/works" class="btn-glass group relative px-8 py-3 rounded-full border border-green-600/30 text-green-700 dark:text-green-300 font-bold overflow-hidden transition-all hover:scale-105 hover:bg-green-600/10">
             <span class="relative z-10 flex items-center">
                <i class="fa-solid fa-image mr-2"></i> 作品
             </span>
          </router-link>

          <router-link to="/projects" class="btn-glass group relative px-8 py-3 rounded-full border border-green-600/30 text-green-700 dark:text-green-300 font-bold overflow-hidden transition-all hover:scale-105 hover:bg-green-600/10">
             <span class="relative z-10 flex items-center">
                <i class="fa fa-user mr-2"></i> 项目
             </span>
          </router-link>
        </div>
      </div>
    </section>

    <section class="w-full mt-10 anim-fade-in-up" id="pinned-content" style="animation-delay: 0.2s;">
      <h3 class="text-3xl font-bold mb-8 text-center flex items-center justify-center">
        <span class="w-8 h-1 bg-green-500 rounded-full mr-4"></span>
        精选置顶
        <span class="w-8 h-1 bg-green-500 rounded-full ml-4"></span>
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
        <div 
          v-for="(item, index) in items" 
          :key="index"
          class="glass-card group p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-gray-100 dark:border-gray-700/50 relative overflow-hidden"
          @click="openLink(item.link)"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h4 class="text-xl font-bold mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{{ item.title }}</h4>
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed">{{ item.description }}</p>
          <div class="mt-4 flex justify-end">
             <i class="fa-solid fa-arrow-right text-gray-300 group-hover:text-green-500 transform group-hover:translate-x-2 transition-all"></i>
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

.glass-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.dark .glass-card {
  background: rgba(30, 30, 30, 0.6);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
</style>
