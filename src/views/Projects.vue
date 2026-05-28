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
  <div class="w-full font-sans max-w-[1400px] mx-auto px-4 md:px-12 py-6 md:py-8">
    <div class="border-b border-[var(--color-border)] pb-3 md:pb-4 mb-6 md:mb-8 relative">
      <div class="absolute -top-6 -left-4 font-art text-[60px] md:text-[80px] leading-none opacity-5 text-[var(--color-text)] pointer-events-none z-[-1] tracking-tighter whitespace-nowrap overflow-hidden">DEPLOY</div>
      <h2 class="text-2xl md:text-3xl font-art tracking-widest text-[var(--color-text)] uppercase">> DEPLOYED_PROJECTS</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 stagger-children">
      <div
        v-for="(project, index) in projects"
        :key="index"
        class="cyber-glass group overflow-hidden flex flex-col h-full !p-0 reveal is-visible transition-colors hover:border-[var(--color-brand)]"
      >
        <!-- Disk Shutter & Top Case -->
        <div class="aspect-video w-full overflow-hidden relative bg-[var(--color-bg)] flex items-center justify-center border-b border-[var(--color-border)]">
          <!-- Slide Shutter CSS graphic -->
          <div class="absolute top-2 left-6 w-24 h-16 bg-[var(--color-border)]/50 border border-[var(--color-border)] flex justify-between p-2 opacity-50 z-10">
            <div class="w-4 h-full bg-[var(--color-text)] opacity-20"></div>
            <div class="w-1.5 h-full bg-[var(--color-text)] opacity-20"></div>
          </div>
          <!-- Write Protect Tab -->
          <div class="absolute top-0 right-4 w-6 h-4 bg-[var(--color-brand)] opacity-80 z-10"></div>

          <img
            :src="getImageUrl(project.image)"
            :alt="project.title"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          >
          
          <!-- Overlay Actions -->
          <div class="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-sm">
            <a
              v-if="project.live_url"
              :href="project.live_url"
              target="_blank"
              class="btn-terminal"
              title="预览"
            >
              [ RUN.EXE ]
            </a>
            <a
              v-if="project.source_url"
              :href="project.source_url"
              target="_blank"
              class="btn-terminal"
              title="源码"
            >
              [ SOURCE ]
            </a>
          </div>
        </div>

        <!-- Floppy Sticker Label -->
        <div class="p-6 md:p-8 flex flex-col flex-grow relative">
          <!-- Sticker Grid background effect -->
          <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMCIvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzIyMiIgc3Ryb2tlLW9wYWNpdHk9IjAuNSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KPC9zdmc+')] opacity-20 pointer-events-none"></div>

          <h3 class="text-xl font-art tracking-wide text-[var(--color-text)] group-hover:text-[var(--color-brand)] transition-colors mb-3 flex items-center gap-2">
            > {{ project.title.toUpperCase() }}
            <span class="opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 font-mono text-[10px]">></span>
          </h3>
          <p class="text-[13px] text-[var(--color-text-dim)] mb-6 flex-grow leading-relaxed font-sans">{{ project.description }}</p>

          <div class="flex flex-wrap gap-2 mt-auto">
            <span
              v-for="(tag, tIndex) in project.tags"
              :key="tIndex"
              class="text-[10px] border border-[var(--color-border)] px-2 py-1 uppercase font-mono tracking-widest bg-[var(--color-bg)] group-hover:border-[var(--color-brand)] transition-colors opacity-80"
            >
              #{{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
