<script setup lang="ts">
import { ref } from 'vue';
import toolsData from '../data/tools.json';

interface Tool {
  title: string;
  description: string;
  icon: string;
  link: string;
}

const tools = ref<Tool[]>(toolsData);

const openLink = (link: string) => {
  if (link && !link.includes('javascript:void(0)')) {
    window.open(link, '_blank');
  }
};
</script>

<template>
  <div class="min-h-screen flex flex-col items-center relative z-10 w-full">
    <main class="w-full max-w-7xl mx-auto px-4 py-8 flex-grow flex flex-col items-center">
      <section class="py-16 text-center w-full anim-fade-in-up active" id="tools-section">
        <h2 class="text-4xl md:text-5xl font-extrabold mb-8 text-text-primary">我的工具箱</h2>
        <p class="text-lg md:text-xl leading-relaxed mb-12 text-text-primary opacity-90">
          这里收集了我开发或日常使用的工具和资源
        </p>

        <div class="tools-grid">
          <a
            v-for="(tool, index) in tools"
            :key="index"
            :href="tool.link && !tool.link.includes('javascript:void(0)') ? tool.link : 'javascript:void(0)'"
            @click.prevent="openLink(tool.link)"
            class="solid-card tool-card group hover:scale-105 transition duration-300 anim-fade-in-up active"
            :style="{ animationDelay: `${0.1 + index * 0.05}s` }"
          >
            <i :class="`${tool.icon} tool-icon`"></i>
            <h4 class="text-text-primary">{{ tool.title }}</h4>
            <p class="text-text-primary">{{ tool.description }}</p>
            <div class="tool-link-button">
              <i class="fa fa-external-link-alt"></i>
              <span>访问</span>
            </div>
          </a>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.tool-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px;
  height: 100%;
  text-decoration: none;
  cursor: pointer;
}

.tool-card .tool-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  color: var(--amethyst-color);
  transition: transform 0.3s ease;
}

.tool-card:hover .tool-icon {
  transform: scale(1.1) rotate(5deg);
}

.tool-card h4 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.tool-card p {
  font-size: 1rem;
  opacity: 0.8;
  flex-grow: 1;
  margin-bottom: 16px;
}

.tool-card .tool-link-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 9999px;
  background-color: var(--amethyst-color);
  color: #ffffff; /* Explicit white for button text */
  font-weight: 500;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.tool-card .tool-link-button:hover {
  background-color: var(--amethyst-color-hover);
  transform: translateY(-2px);
}

.tool-card .tool-link-button i {
  font-size: 1rem;
}
</style>
