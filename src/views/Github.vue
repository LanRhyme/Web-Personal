<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Repository {
  id: number;
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
  updated_at: string;
}

interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: {
    name: string;
    url: string;
  };
  payload: any;
}

const repos = ref<Repository[]>([]);
const events = ref<GitHubEvent[]>([]);
const pinnedRepos = ref<Repository[]>([]);
const loadingRepos = ref(true);
const loadingEvents = ref(true);
const loadingPinned = ref(true);
const errorRepos = ref('');
const errorEvents = ref('');

// Custom list of pinned repositories
const pinnedRepoNames = ['LanRhyme/Web-MinecraftLogAnalyzer', 'LanRhyme/GeminiChatPlugin', 'LanRhyme/VoidFallProtectionPlugin'];

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

const getCachedData = <T>(key: string): T | null => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  
  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
    localStorage.removeItem(key);
    return null;
  } catch (e) {
    localStorage.removeItem(key);
    return null;
  }
};

const setCachedData = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error('Failed to cache data', e);
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatEventType = (type: string) => {
  const types: Record<string, string> = {
    PushEvent: '推送代码',
    CreateEvent: '创建仓库/分支',
    WatchEvent: '标星仓库',
    ForkEvent: '复刻仓库',
    IssuesEvent: 'Issue 动态',
    PullRequestEvent: 'Pull Request',
    IssueCommentEvent: '评论 Issue',
    ReleaseEvent: '发布版本'
  };
  return types[type] || type;
};

const fetchPinnedRepos = async () => {
  const cacheKey = 'github_pinned_repos';
  const cached = getCachedData<Repository[]>(cacheKey);
  
  if (cached) {
    pinnedRepos.value = cached;
    loadingPinned.value = false;
    return;
  }

  try {
    const manualPromises = pinnedRepoNames.map(async fullName => {
      const response = await fetch(`https://api.github.com/repos/${fullName}`);
      if (!response.ok) return null;
      return response.json();
    });

    const orgPromise = fetch('https://api.github.com/orgs/ShardLauncher/repos?sort=stars&per_page=3')
      .then(res => res.ok ? res.json() : [])
      .catch(() => []);

    const [manualResults, orgResults] = await Promise.all([
      Promise.all(manualPromises),
      orgPromise
    ]);

    const validManualRepos = manualResults.filter((repo): repo is Repository => repo !== null);
    const combinedRepos = [...validManualRepos, ...orgResults];
    const uniqueRepos = Array.from(new Map(combinedRepos.map(repo => [repo.id, repo])).values());
    uniqueRepos.sort((a, b) => b.stargazers_count - a.stargazers_count);

    pinnedRepos.value = uniqueRepos;
    setCachedData(cacheKey, uniqueRepos);
  } catch (e) {
    console.error('Failed to fetch pinned repos', e);
  } finally {
    loadingPinned.value = false;
  }
};

const fetchRepos = async () => {
  const cacheKey = 'github_recent_repos';
  const cached = getCachedData<Repository[]>(cacheKey);

  if (cached) {
    repos.value = cached;
    loadingRepos.value = false;
    return;
  }

  try {
    const [userReposRes, orgReposRes] = await Promise.all([
      fetch('https://api.github.com/users/LanRhyme/repos?sort=updated&per_page=12'),
      fetch('https://api.github.com/orgs/ShardLauncher/repos?sort=updated&per_page=12')
    ]);
    
    const userRepos = userReposRes.ok ? await userReposRes.json() : [];
    const orgRepos = orgReposRes.ok ? await orgReposRes.json() : [];
    const allRepos = [...userRepos, ...orgRepos].sort((a: any, b: any) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    
    const finalRepos = allRepos.slice(0, 12);
    repos.value = finalRepos;
    setCachedData(cacheKey, finalRepos);
  } catch (e) {
    errorRepos.value = '无法加载仓库列表';
    console.error(e);
  } finally {
    loadingRepos.value = false;
  }
};

const fetchEvents = async () => {
  const cacheKey = 'github_events';
  const cached = getCachedData<GitHubEvent[]>(cacheKey);

  if (cached) {
    events.value = cached;
    loadingEvents.value = false;
    return;
  }

  try {
    const response = await fetch('https://api.github.com/users/LanRhyme/events/public?per_page=10');
    if (!response.ok) throw new Error('Failed to fetch events');
    const data = await response.json();
    events.value = data;
    setCachedData(cacheKey, data);
  } catch (e) {
    errorEvents.value = '无法加载动态列表';
    console.error(e);
  } finally {
    loadingEvents.value = false;
  }
};

onMounted(() => {
  fetchPinnedRepos();
  fetchRepos();
  fetchEvents();
});
</script>

<template>
  <div class="flex flex-col items-center w-full anim-fade-in-up">
    <!-- Header -->
    <section class="w-full py-10">
      <div class="text-center mb-12">
        <h2 class="text-5xl font-extrabold tracking-tight mb-4">
          <span class="text-[var(--color-primary)]">GitHub</span> 
          <span class="text-brand-gradient"> Activity</span>
        </h2>
        <p class="text-lg text-[var(--color-secondary)] font-medium">最近的代码动态与开源仓库</p>
      </div>

      <div class="flex flex-col gap-10 px-4 max-w-5xl mx-auto">
        
        <!-- Pinned Repositories -->
        <div class="w-full">
          <h3 class="section-heading mb-6">置顶仓库</h3>
          
          <div v-if="loadingPinned" class="flex justify-center py-12">
            <div class="spinner"></div>
          </div>
          
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-5 stagger-children">
            <a v-for="repo in pinnedRepos" :key="repo.id" :href="repo.html_url" target="_blank" 
               class="card group relative overflow-hidden transition-all duration-500 anim-fade-in-up">
              <div class="flex justify-between items-start mb-4">
                <h4 class="font-bold text-lg text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors flex items-center gap-2">
                  <i class="fa-solid fa-bookmark text-sm"></i>
                  {{ repo.name }}
                </h4>
                <span class="tag">
                  {{ repo.language || 'Code' }}
                </span>
              </div>
              <p class="text-sm text-[var(--color-secondary)] mb-4 h-11 overflow-hidden line-clamp-2 leading-relaxed">
                {{ repo.description || '暂无描述' }}
              </p>
              <div class="flex justify-between items-center text-xs text-[var(--color-secondary)]/80 pt-4 border-t border-white/40">
                <span class="flex items-center gap-1.5">
                  <i class="fa-solid fa-star text-[var(--color-brand)]"></i>
                  {{ repo.stargazers_count }}
                </span>
                <span>{{ formatDate(repo.updated_at) }}</span>
              </div>
            </a>
          </div>
        </div>

        <!-- Recent Repositories -->
        <div class="w-full">
          <h3 class="section-heading mb-6">最近更新</h3>
          
          <div v-if="loadingRepos" class="flex justify-center py-12">
            <div class="spinner"></div>
          </div>
          
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-5 stagger-children">
            <a v-for="repo in repos" :key="repo.id" :href="repo.html_url" target="_blank" 
               class="card group relative overflow-hidden transition-all duration-500 anim-fade-in-up">
              <div class="flex justify-between items-start mb-4">
                <h4 class="font-bold text-lg text-[var(--color-primary)] group-hover:text-[var(--color-brand)] transition-colors">{{ repo.name }}</h4>
                <span class="tag">
                  {{ repo.language || 'Code' }}
                </span>
              </div>
              <p class="text-sm text-[var(--color-secondary)] mb-4 h-11 overflow-hidden line-clamp-2 leading-relaxed">
                {{ repo.description || '暂无描述' }}
              </p>
              <div class="flex justify-between items-center text-xs text-[var(--color-secondary)]/80 pt-4 border-t border-white/40">
                <span class="flex items-center gap-1.5">
                  <i class="fa-solid fa-star text-[var(--color-brand)]"></i>
                  {{ repo.stargazers_count }}
                </span>
                <span>{{ formatDate(repo.updated_at) }}</span>
              </div>
            </a>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="w-full">
          <h3 class="section-heading mb-6">动态流</h3>

          <div v-if="loadingEvents" class="flex justify-center py-12">
            <div class="spinner"></div>
          </div>

          <div v-else class="space-y-6 relative ml-2">
            <div class="timeline-line"></div>
            
            <div v-for="event in events" :key="event.id" class="relative pl-10 anim-fade-in-up">
              <div class="timeline-dot"></div>
              
              <div class="card !p-5 group">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-bold text-sm text-[var(--color-brand)] flex items-center gap-2">
                    <i class="fa-solid fa-bolt text-xs"></i>
                    {{ formatEventType(event.type) }}
                  </span>
                  <span class="text-xs text-[#a4c9b3]">{{ formatDate(event.created_at) }}</span>
                </div>
                <div class="text-sm mb-3">
                  <a :href="`https://github.com/${event.repo.name}`" target="_blank" class="font-bold text-[var(--color-primary)] hover:text-[var(--color-brand)] transition-colors break-all">
                    {{ event.repo.name }}
                  </a>
                </div>
                <div v-if="event.payload.commits" class="text-xs text-[var(--color-secondary)] bg-white/30 p-3 rounded-xl border border-white/30">
                  <div v-for="commit in event.payload.commits.slice(0, 2)" :key="commit.sha" class="truncate flex items-start gap-2">
                    <span class="text-[var(--color-brand)] shrink-0">-</span>
                    <span>{{ commit.message }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
