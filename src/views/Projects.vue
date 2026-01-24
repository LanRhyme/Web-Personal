<script setup lang="ts">
import projectsData from '../data/projects.json';

interface Project {
  image: string;
  title: string;
  description: string;
  tags: string[];
  live_url: string;
  source_url: string;
}

const projects: Project[] = projectsData;

const getImageUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? path : '/' + path;
};
</script>

<template>
  <div class="right-content-area w-full anim-fade-in-up">
    <h2 class="text-3xl font-bold mb-6 text-center lg:text-left">项目展示</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div 
        v-for="(project, index) in projects" 
        :key="index"
        class="solid-card overflow-hidden hover:scale-[1.02] transform transition-all duration-300 flex flex-col h-full"
      >
        <div class="h-48 overflow-hidden relative group">
          <img 
            :src="getImageUrl(project.image)" 
            :alt="project.title"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          >
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
             <div class="flex gap-4">
                <a 
                  v-if="project.live_url" 
                  :href="project.live_url" 
                  target="_blank"
                  class="bg-white text-gray-900 p-2 rounded-full hover:bg-amethyst hover:text-white transition-colors"
                  title="View Live"
                >
                  <i class="fa fa-external-link-alt"></i>
                </a>
                <a 
                  v-if="project.source_url" 
                  :href="project.source_url" 
                  target="_blank"
                  class="bg-white text-gray-900 p-2 rounded-full hover:bg-amethyst hover:text-white transition-colors"
                  title="View Source"
                >
                  <i class="fab fa-github"></i>
                </a>
             </div>
          </div>
        </div>
        
        <div class="p-5 flex flex-col flex-grow">
          <h3 class="text-xl font-bold mb-2">{{ project.title }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">{{ project.description }}</p>
          
          <div class="flex flex-wrap gap-2 mt-auto">
            <span 
              v-for="(tag, tIndex) in project.tags" 
              :key="tIndex"
              class="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
