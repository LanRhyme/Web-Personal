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
  <aside class="me-card solid-card anim-fade-in-up w-full lg:w-[320px] flex-shrink-0">
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
      <p><strong><i class="fa fa-envelope fa-fw mr-2"></i>邮箱:</strong> <a href="mailto:i@lanrhyme.com">lanrhyme@outlook.com</a></p>
      <p><strong><i class="fa fa-map-marker-alt fa-fw mr-2"></i>坐标:</strong> Earth</p>
      <p><strong><i class="fab fa-github fa-fw mr-2"></i>GitHub:</strong> <span>{{ githubInfo }}</span></p>
      <p 
        class="font-bold mt-4 cursor-pointer p-2 rounded-md transition text-center hover:bg-gray-100 dark:hover:bg-gray-700" 
        @click="fetchHitokoto"
      >
        {{ yiyan }}
      </p>
    </div>
    <div class="me-social-links mt-4 text-center">
      <a aria-label="GitHub" href="https://github.com/LanRhyme" target="_blank"><i class="fab fa-github"></i></a>
      <a aria-label="Bilibili" href="https://space.bilibili.com/496901387" target="_blank"><i class="fab fa-bilibili"></i></a>
      <a aria-label="LinkedIn" href="#" target="_blank"><i class="fab fa-linkedin"></i></a>
    </div>
  </aside>
</template>

<style scoped>
.me-card {
  padding: 20px;
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
  background-color: var(--amethyst-color);
  border-radius: 2px;
}

.me-image {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto 15px;
  border: 3px solid var(--amethyst-color);
  overflow: hidden;
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
  color: var(--amethyst-color);
  transform: scale(1.2);
}

@media (max-width: 992px) {
  .me-card {
    width: 100% !important;
    max-width: 100%;
    margin: 0 0 20px 0;
    display: block !important;
  }
}
</style>
