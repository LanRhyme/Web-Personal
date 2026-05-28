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
  <div class="w-full reveal is-visible font-sans">
    <h2 class="section-heading mb-8 text-3xl">> DEPLOYED_PROJECTS</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 stagger-children">
      <div
        v-for="(project, index) in projects"
        :key="index"
        class="premium-card group overflow-hidden flex flex-col h-full !p-0 reveal is-visible"
      >
        <!-- Disk Shutter & Top Case -->
        <div class="h-40 overflow-hidden relative bg-[var(--color-text)]/5 flex items-center justify-center border-b-4 border-[var(--color-text)]">
          <!-- Slide Shutter CSS graphic -->
          <div class="absolute top-2 left-6 w-24 h-16 bg-[var(--color-text-dim)]/20 border-2 border-[var(--color-text)] flex justify-between p-2">
            <div class="w-4 h-full bg-[var(--color-text)] opacity-40"></div>
            <div class="w-1.5 h-full bg-[var(--color-text)] opacity-40"></div>
          </div>
          <!-- Write Protect Tab -->
          <div class="absolute top-0 right-4 w-6 h-4 bg-[var(--color-text)]"></div>

          <img
            :src="getImageUrl(project.image)"
            :alt="project.title"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale hover:grayscale-0"
          >
          
          <!-- Overlay Actions -->
          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
            <a
              v-if="project.live_url"
              :href="project.live_url"
              target="_blank"
              class="premium-btn !px-4 !py-2 !text-xs !bg-cyan-500 !text-black"
              title="预览"
            >
              [ RUN.EXE ]
            </a>
            <a
              v-if="project.source_url"
              :href="project.source_url"
              target="_blank"
              class="premium-btn !px-4 !py-2 !text-xs"
              title="源码"
            >
              [ SOURCE ]
            </a>
          </div>
        </div>

        <!-- Floppy Sticker Label -->
        <div class="p-6 flex flex-col flex-grow bg-[var(--color-card)] relative">
          <!-- Sticker Grid background effect -->
          <div class="absolute inset-0 bg-grid-lines opacity-10 pointer-events-none"></div>

          <h3 class="text-xl font-bold text-[var(--color-brand)] mb-2 flex items-center gap-2 font-sans">
            > {{ project.title.toUpperCase() }}
            <i class="fa fa-arrow-right text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1 text-[var(--color-text)]"></i>
          </h3>
          <p class="text-xs text-[var(--color-text)] mb-4 flex-grow leading-relaxed font-sans font-medium">{{ project.description }}</p>

          <div class="flex flex-wrap gap-1.5 mt-auto">
            <span
              v-for="(tag, tIndex) in project.tags"
              :key="tIndex"
              class="text-[9px] border-2 border-[var(--color-text)] px-2 py-0.5 uppercase font-bold font-sans bg-[var(--color-bg)]"
            >
              #{{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
