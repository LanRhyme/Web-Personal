<script setup lang="ts">
import pinnedItems from '../data/pinned-items.json';

interface PinnedItem {
  title: string;
  description: string;
  link: string;
}

const items: PinnedItem[] = pinnedItems;

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
    <section class="py-16 text-center w-full anim-fade-in-up" id="home" style="animation-delay: 0.1s;">
      <h2 class="text-5xl font-extrabold mb-4">Hello，I'm <span class="highlight-text relative inline-block">LanRhyme</span></h2>
      <p class="text-xl leading-relaxed">一名热衷于创造和探索的<br>开发者、画师</p>
      <div class="mt-8 flex justify-center space-x-4 flex-wrap gap-4">
        <router-link to="/commissions" class="amethyst-dark-button py-2 px-5 rounded-md transition-colors duration-300 inline-flex items-center">
          <i class="fa-solid fa-pencil mr-2"></i> 约稿
        </router-link>
        <router-link to="/works" class="solid-card py-2 px-5 rounded-md transition-colors duration-300 inline-flex items-center font-medium hover:text-amethyst">
          <i class="fa-solid fa-image mr-2"></i> 作品
        </router-link>
        <router-link to="/projects" class="solid-card py-2 px-5 rounded-md transition-colors duration-300 inline-flex items-center font-medium hover:text-amethyst">
          <i class="fa fa-user mr-2"></i> 项目
        </router-link>
      </div>
    </section>

    <section class="w-full mt-6 anim-fade-in-up" id="pinned-content" style="animation-delay: 0.2s;">
      <h3 class="text-3xl font-bold mb-6 text-center">置顶</h3>
      <div class="flex flex-wrap justify-center gap-6">
        <div 
          v-for="(item, index) in items" 
          :keyাৎ="index"
          class="solid-card p-6 w-full md:w-80 cursor-pointer hover:scale-105 transform transition-transform duration-300"
          @click="openLink(item.link)"
        >
          <h4 class="text-xl font-bold mb-2">{{ item.title }}</h4>
          <p class="text-gray-600 dark:text-gray-400">{{ item.description }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Scoped styles if needed */
</style>
