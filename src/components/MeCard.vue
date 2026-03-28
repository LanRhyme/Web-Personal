<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const githubInfo = ref('加载中...');

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'Good Morning ☀️';
  if (hour >= 12 && hour < 18) return 'Good Afternoon 🌤';
  if (hour >= 18 && hour < 22) return 'Good Evening 🌙';
  return 'Good Night ✨';
}

const greeting = ref(getGreeting());

const fetchGithubInfo = async () => {
  try {
    const response = await fetch('https://api.github.com/users/LanRhyme');
    if (response.ok) {
      const data = await response.json();
      githubInfo.value = `${data.public_repos} Repos · ${data.followers} Followers`;
    } else {
      githubInfo.value = 'GitHub Error';
    }
  } catch (e) {
    githubInfo.value = '网络错误';
  }
};

onMounted(() => {
  fetchGithubInfo();
});
</script>

<template>
  <aside class="card anim-fade-in-up overflow-hidden group flex flex-col items-center text-center p-8" style="animation-delay: 0.05s">
    <!-- Avatar -->
    <div class="avatar-ring overflow-hidden">
      <img alt="LanRhyme Avatar" src="/img/avatar.jpg" class="avatar-img">
    </div>

    <!-- Greeting & Identity -->
    <p class="text-[10px] font-bold text-[var(--color-secondary)] uppercase tracking-[0.2em] mt-6">{{ greeting }}</p>
    <h3 class="text-2xl font-black mt-2 text-[var(--color-primary)]">
      I'm <span class="text-brand-gradient">LanRhyme</span>
    </h3>
    <p class="text-xs text-[var(--color-secondary)] mt-1 font-medium opacity-80">Full-Stack Developer & Artist</p>

    <div class="w-10 h-[2.5px] bg-[#35bfa0] rounded-full mx-auto my-6 opacity-40 group-hover:w-16 group-hover:opacity-80 transition-all duration-500"></div>

    <!-- Stats & Contact Hub -->
    <div class="flex flex-col gap-4 w-full">
        <div class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[rgba(53,191,160,0.06)] border border-[rgba(53,191,160,0.1)] transition-all group-hover:bg-[rgba(53,191,160,0.1)]">
            <i class="fab fa-github text-[#35bfa0] text-sm"></i>
            <span class="text-[11px] font-bold text-[var(--color-secondary)]">{{ githubInfo }}</span>
        </div>
        
        <div class="flex justify-center gap-4 mt-2">
            <a href="https://github.com/LanRhyme" target="_blank" class="social-icon !w-12 !h-12 border-none shadow-sm"><i class="fab fa-github"></i></a>
            <a href="https://space.bilibili.com/496901387" target="_blank" class="social-icon !w-12 !h-12 border-none shadow-sm"><i class="fab fa-bilibili"></i></a>
            <a href="mailto:i@lanrhyme.com" class="social-icon !w-12 !h-12 border-none shadow-sm"><i class="fa fa-envelope"></i></a>
        </div>
    </div>
  </aside>
</template>

<style scoped>
.avatar-ring {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  padding: 4px;
  background: linear-gradient(135deg, #35bfa0, #1fc9a8, #a8e6cf);
  box-shadow: 0 16px 32px -8px rgba(53, 191, 160, 0.2);
  transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.6s ease;
}

.card:hover .avatar-ring {
  transform: scale(1.08) rotate(3deg);
  box-shadow: 0 20px 40px -8px rgba(53, 191, 160, 0.35);
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--color-card-solid);
}
</style>
