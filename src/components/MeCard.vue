<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const currentTime = ref('加载中...');
const githubInfo = ref('加载中...');
const yiyan = ref('正在获取每日一言...');

let timer: number;

const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const fetchGithubInfo = async () => {
  try {
    const response = await fetch('https://api.github.com/users/LanRhyme');
    if (response.ok) {
        const data = await response.json();
        githubInfo.value = `${data.public_repos} Repos / ${data.followers} Followers`;
    } else {
        githubInfo.value = 'GitHub Error';
    }
  } catch (e) {
    githubInfo.value = 'Network Error';
  }
};

const fetchHitokoto = async () => {
    yiyan.value = '加载中...';
    try {
        const response = await fetch('https://v1.hitokoto.cn');
        if (response.ok) {
            const data = await response.json();
            yiyan.value = `“${data.hitokoto}” — ${data.from}`;
        } else {
            yiyan.value = '获取失败';
        }
    } catch (e) {
        yiyan.value = '网络错误';
    }
};

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
  fetchGithubInfo();
  fetchHitokoto();
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<template>
  <aside class="me-card jelly-glass anim-fade-in-up w-full lg:w-[320px] flex-shrink-0 relative overflow-hidden group">
    <!-- Inner subtle glow -->
    <div class="absolute inset-0 bg-gradient-to-b from-[rgba(var(--jelly-green-rgb),0.05)] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div class="me-image">
      <img alt="LanRhyme Avatar" src="/img/avatar.jpg">
    </div>
    <div class="mb-4 text-center">
      <h3 class="text-2xl font-bold">LanRhyme</h3>
      <p>Developer & Painter</p>
      <p class="font-bold">今天转瞬即逝，而又永恒</p>
    </div>
    <div class="me-info text-left text-sm space-y-2">
      <p><strong><i class="fa fa-clock fa-fw mr-2"></i>时间:</strong> <span>{{ currentTime }}</span></p>
      <p><strong><i class="fa fa-envelope fa-fw mr-2"></i>邮箱:</strong> <a href="mailto:i@lanrhyme.com">xiao_ren233@foxmail.com</a></p>
      <p><strong><i class="fa fa-map-marker-alt fa-fw mr-2"></i>坐标:</strong> Earth</p>
      <p><strong><i class="fab fa-github fa-fw mr-2"></i>GitHub:</strong> <span>{{ githubInfo }}</span></p>
      <p 
        class="font-bold mt-4 cursor-pointer p-2 transition text-center" 
        @click="fetchHitokoto"
      >
        {{ yiyan }}
      </p>
    </div>
    <div class="me-social-links mt-4 text-center">
      <a aria-label="GitHub" href="https://github.com/LanRhyme" target="_blank"><i class="fab fa-github"></i></a>
      <a aria-label="Bilibili" href="https://space.bilibili.com/496901387" target="_blank"><i class="fab fa-bilibili"></i></a>
    </div>
  </aside>
</template>

<style scoped>
.me-card {
  padding: 32px 24px;
  text-align: center;
  position: relative;
  z-index: 10;
}

.me-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 4px;
  background-color: rgba(var(--jelly-green-rgb), 0.6);
  box-shadow: 0 2px 10px rgba(var(--jelly-green-rgb), 0.4);
  border-radius: 2px;
  transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.me-card:hover::before {
  width: 80px;
  background-color: rgb(var(--jelly-green-rgb));
  box-shadow: 0 2px 15px rgba(var(--jelly-green-rgb), 0.6);
}

.me-image {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto 15px;
  border: 3px solid rgba(var(--jelly-green-rgb), 0.4);
  box-shadow: 0 0 20px rgba(var(--jelly-green-rgb), 0.15);
  overflow: hidden;
  position: relative;
  z-index: 10;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.me-card:hover .me-image {
  transform: scale(1.05);
  border-color: rgba(var(--jelly-green-rgb), 0.8);
  box-shadow: 0 0 30px rgba(var(--jelly-green-rgb), 0.3);
}

.me-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.me-info a {
  color: var(--footer-link);
  text-decoration: none;
  transition: color 0.3s ease;
}

.me-info a:hover {
  text-decoration: underline;
}

.me-social-links a {
  display: inline-block;
  margin: 0 10px;
  color: var(--text-primary);
  font-size: 1.5rem;
  transition: color 0.3s ease, transform 0.3s ease;
}

.me-social-links a:hover {
  color: rgb(var(--jelly-green-rgb));
  text-shadow: 0 0 10px rgba(var(--jelly-green-rgb), 0.4);
  transform: scale(1.2) translateY(-2px);
}

@media (max-width: 1024px) {
  .me-card {
    margin: 0 0 20px 0;
  }
}
</style>
