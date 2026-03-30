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
  <div class="w-full anim-fade-in-up">
    <h2 class="section-heading mb-8">项目展示</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
      <div
        v-for="(project, index) in projects"
        :key="index"
        class="card group overflow-hidden flex flex-col h-full !p-0 anim-fade-in-up"
      >
        <!-- Image -->
        <div class="h-48 overflow-hidden relative">
          <img
            :src="getImageUrl(project.image)"
            :alt="project.title"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          >
          <!-- Overlay Actions -->
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div class="flex gap-3">
              <a
                v-if="project.live_url"
                :href="project.live_url"
                target="_blank"
                class="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-brand)] hover:text-white transition-colors shadow-md"
                title="预览"
              >
                <i class="fa fa-external-link-alt text-sm"></i>
              </a>
              <a
                v-if="project.source_url"
                :href="project.source_url"
                target="_blank"
                class="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-brand)] hover:text-white transition-colors shadow-md"
                title="源码"
              >
                <i class="fab fa-github text-sm"></i>
              </a>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 flex flex-col flex-grow">
          <h3 class="text-lg font-bold text-[var(--color-primary)] mb-2 flex items-center gap-2">
            {{ project.title }}
            <i class="fa fa-arrow-right text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1 text-[var(--color-brand)]"></i>
          </h3>
          <p class="text-sm text-[var(--color-secondary)] mb-4 flex-grow leading-relaxed">{{ project.description }}</p>

          <div class="flex flex-wrap gap-2 mt-auto">
            <span
              v-for="(tag, tIndex) in project.tags"
              :key="tIndex"
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
