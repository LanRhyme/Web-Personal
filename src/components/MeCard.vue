<script setup lang="ts">
import { ref, onMounted } from 'vue';

const githubInfo = ref('WAITING...');

const fetchGithubInfo = async () => {
  try {
    const userRes = await fetch('https://api.github.com/users/LanRhyme');
    if (!userRes.ok) throw new Error('API Error');
    const userData = await userRes.json();
    
    let totalStars = 0;
    try {
      const reposRes = await fetch('https://api.github.com/users/LanRhyme/repos?per_page=100');
      if (reposRes.ok) {
        const reposData = await reposRes.json();
        totalStars = reposData.reduce((acc: number, repo: any) => acc + repo.stargazers_count, 0);
      }
    } catch (e) {
      // Ignore repo fetch error, just show 0 stars
    }

    githubInfo.value = `FLW:${userData.followers} / STR:${totalStars}`;
  } catch (e) {
    githubInfo.value = 'OFFLINE';
  }
};

onMounted(() => {
  fetchGithubInfo();
});
</script>

<template>
  <aside class="cyber-glass p-6 sm:p-8 flex flex-col font-mono uppercase text-[var(--color-text)] transition-all">
    <!-- Header -->
    <div class="border-b border-[var(--color-border)] pb-4 mb-6 flex justify-between items-center text-[10px] tracking-widest">
      <span class="font-bold opacity-60">STATUS: LANRHYME.OS</span>
      <span class="animate-pulse text-[var(--color-accent)] font-bold">● ACTIVE</span>
    </div>

    <!-- Avatar Placeholder & Core Stats -->
    <div class="flex flex-col gap-8">
      <div class="flex items-center gap-4">
        <!-- Minimalist Avatar Frame -->
        <div class="w-14 h-14 bg-transparent flex items-center justify-center border border-[var(--color-brand)] overflow-hidden relative">
          <img src="/img/avatar.png" alt="Avatar" loading="lazy" decoding="async" class="w-full h-full object-cover opacity-80 mix-blend-luminosity grayscale hover:grayscale-0 transition-all duration-500" />
          <div class="absolute inset-0 border border-[var(--color-brand)] mix-blend-overlay"></div>
        </div>
        <div class="flex flex-col gap-1 tracking-widest">
          <span class="font-art font-bold text-xl leading-none">LanRhyme</span>
          <span class="text-[9px] opacity-40">LV.26 FULL-STACK / ARTIST</span>
        </div>
      </div>



      <!-- Detailed Attributes -->
      <div class="flex flex-col gap-3 text-[10px] border-t border-[var(--color-border)] pt-6 tracking-widest leading-relaxed">
        <div class="flex justify-between">
          <span class="opacity-40">DESIGNATION</span>
          <span class="font-bold">CREATOR</span>
        </div>
        <div class="flex justify-between">
          <span class="opacity-40">ATTACK_PWR</span>
          <span class="text-[var(--color-text)]">RUST / KOTLIN</span>
        </div>
        <div class="flex justify-between">
          <span class="opacity-40">DEFENSE_PWR</span>
          <span class="text-[var(--color-text)]">ILLUSTRATION</span>
        </div>
        <div class="flex justify-between">
          <span class="opacity-40">MBTI</span>
          <span class="text-[var(--color-text)]">INFP</span>
        </div>
        <div class="flex justify-between mt-2 pt-2 border-t border-[var(--color-border)] border-dashed">
          <span class="opacity-40">GITHUB_NET</span>
          <span class="text-[var(--color-brand)]">{{ githubInfo }}</span>
        </div>
      </div>
    </div>

    <!-- Action Links as Terminal Commands -->
    <div class="mt-8 border-t border-[var(--color-border)] pt-6 flex flex-col gap-3">
      <a href="https://github.com/LanRhyme" target="_blank" class="btn-terminal flex justify-center items-center gap-2 w-full !text-[10px]">
        <i class="fa-brands fa-github text-[12px]"></i> EXEC_GITHUB
      </a>
      <a href="https://space.bilibili.com/496901387" target="_blank" class="btn-terminal flex justify-center items-center gap-2 w-full !text-[10px]">
        <i class="fa-brands fa-bilibili text-[12px]"></i> EXEC_BILIBILI
      </a>
      <a href="mailto:i@lanrhyme.com" class="btn-terminal flex justify-center items-center gap-2 w-full !text-[10px]">
        <i class="fa-solid fa-envelope text-[12px]"></i> INIT_CONTACT
      </a>
    </div>
  </aside>
</template>
