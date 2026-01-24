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
    // Fetch manually pinned repos
    const manualPromises = pinnedRepoNames.map(async fullName => {
      const response = await fetch(`https://api.github.com/repos/${fullName}`);
      if (!response.ok) return null;
      return response.json();
    });

    // Fetch top starred repos from organization automatically
    const orgPromise = fetch('https://api.github.com/orgs/ShardLauncher/repos?sort=stars&per_page=3')
      .then(res => res.ok ? res.json() : [])
      .catch(() => []);

    const [manualResults, orgResults] = await Promise.all([
      Promise.all(manualPromises),
      orgPromise
    ]);

    const validManualRepos = manualResults.filter((repo): repo is Repository => repo !== null);
    
    // Combine and remove duplicates based on ID
    const combinedRepos = [...validManualRepos, ...orgResults];
    const uniqueRepos = Array.from(new Map(combinedRepos.map(repo => [repo.id, repo])).values());
    
    // Sort by stars descending
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
    
    // Combine and sort by updated_at
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
  <div class="flex flex-col items-center w-full">
    <section class="w-full py-10 anim-fade-in-up">
      <div class="text-center mb-12">
        <h2 class="text-4xl font-black mb-4 tracking-tight">
          <span class="text-text-primary">GitHub</span> <span class="bg-clip-text text-transparent bg-gradient-to-r from-[#2d4a2b] to-[#7d8471] dark:from-[#a4ac86] dark:to-[#7d8471]">Activity</span>
        </h2>
        <p class="text-gray-600 dark:text-gray-400">最近的代码动态与开源仓库</p>
      </div>

      <div class="flex flex-col gap-8 px-4 max-w-5xl mx-auto">
        <!-- Pinned Repositories -->
        <div class="w-full">
          <h3 class="text-2xl font-bold mb-6 flex items-center px-2">
            <svg class="w-7 h-7 mr-3 text-[#2d4a2b] dark:text-[#a4ac86]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 11V5h1.5a.5.5 0 0 0 0-1H6.5a.5.5 0 0 0 0 1H8v6a2 2 0 0 1-2 2v1h12v-1a2 2 0 0 1-2-2zM9 5h6v6a1 1 0 0 0 1 1v1H8v-1a1 1 0 0 0 1-1V5z"/>
              <path d="M12 15a1 1 0 0 1 1 1v4h-2v-4a1 1 0 0 1 1-1z"/>
            </svg>
            置顶仓库
          </h3>
          
          <div v-if="loadingPinned" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2d4a2b] dark:border-[#a4ac86]"></div>
          </div>
          
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a v-for="repo in pinnedRepos" :key="repo.id" :href="repo.html_url" target="_blank" 
               class="block p-5 rounded-xl bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-200/60 dark:border-gray-800/60 hover:bg-white/90 dark:hover:bg-[#252525]/90 hover:shadow-lg hover:border-[#2d4a2b]/30 dark:hover:border-[#a4ac86]/30 transition-all duration-300 transform hover:-translate-y-1 group">
              <div class="flex justify-between items-start mb-3">
                <h4 class="font-bold text-lg break-words pr-2 text-gray-900 dark:text-gray-100 group-hover:text-[#2d4a2b] dark:group-hover:text-[#a4ac86] transition-colors flex items-center">
                  <svg class="w-4 h-4 mr-2 text-[#2d4a2b] dark:text-[#a4ac86]" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/></svg>
                  {{ repo.name }}
                </h4>
                <span class="text-xs bg-highlight-bg px-2 py-1 rounded text-amethyst font-medium whitespace-nowrap">
                  {{ repo.language || 'Code' }}
                </span>
              </div>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-4 h-12 overflow-hidden text-ellipsis line-clamp-2 leading-relaxed">
                {{ repo.description || '暂无描述' }}
              </p>
              <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                <span class="flex items-center">
                  <svg class="w-3.5 h-3.5 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg> {{ repo.stargazers_count }}
                </span>
                <span>{{ formatDate(repo.updated_at) }}</span>
              </div>
            </a>
          </div>
        </div>

        <!-- Recent Repositories -->
        <div class="w-full">
          <h3 class="text-2xl font-bold mb-6 flex items-center px-2">
            <svg class="w-7 h-7 mr-3 text-[#2d4a2b] dark:text-[#a4ac86]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
            </svg>
            最近更新仓库
          </h3>
          
          <div v-if="loadingRepos" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2d4a2b] dark:border-[#a4ac86]"></div>
          </div>
          
          <div v-else-if="errorRepos" class="text-center text-red-500 py-4">
            {{ errorRepos }}
          </div>
          
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a v-for="repo in repos" :key="repo.id" :href="repo.html_url" target="_blank" 
               class="block p-5 rounded-xl bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-200/60 dark:border-gray-800/60 hover:bg-white/90 dark:hover:bg-[#252525]/90 hover:shadow-lg hover:border-[#2d4a2b]/30 dark:hover:border-[#a4ac86]/30 transition-all duration-300 transform hover:-translate-y-1 group">
              <div class="flex justify-between items-start mb-3">
                <h4 class="font-bold text-lg break-words pr-2 text-gray-900 dark:text-gray-100 group-hover:text-[#2d4a2b] dark:group-hover:text-[#a4ac86] transition-colors">{{ repo.name }}</h4>
                <span class="text-xs bg-[var(--highlight-bg)] px-2 py-1 rounded text-amethyst font-medium whitespace-nowrap">
                  {{ repo.language || 'Code' }}
                </span>
              </div>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-4 h-12 overflow-hidden text-ellipsis line-clamp-2 leading-relaxed">
                {{ repo.description || '暂无描述' }}
              </p>
              <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                <span class="flex items-center">
                  <svg class="w-3.5 h-3.5 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg> {{ repo.stargazers_count }}
                </span>
                <span>{{ formatDate(repo.updated_at) }}</span>
              </div>
            </a>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="w-full">
          <h3 class="text-2xl font-bold mb-6 flex items-center px-2">
            <svg class="w-7 h-7 mr-3 text-[#2d4a2b] dark:text-[#a4ac86]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            最近动态
          </h3>

          <div v-if="loadingEvents" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2d4a2b] dark:border-[#a4ac86]"></div>
          </div>

          <div v-else-if="errorEvents" class="text-center text-red-500 py-4">
            {{ errorEvents }}
          </div>

          <div v-else class="space-y-4 relative">
            <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200/60 dark:bg-gray-800/60"></div>
            
            <div v-for="event in events" :key="event.id" class="relative pl-10">
              <div class="absolute left-2.5 top-1.5 w-3 h-3 bg-[#2d4a2b] dark:bg-[#a4ac86] rounded-full transform -translate-x-1/2 ring-4 ring-white/50 dark:ring-black/20"></div>
              
              <div class="bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-md p-4 rounded-xl border border-gray-200/60 dark:border-gray-800/60 hover:bg-white/90 dark:hover:bg-[#252525]/90 hover:shadow-md transition-all">
                <div class="flex justify-between items-start mb-1">
                  <span class="font-bold text-sm text-[#2d4a2b] dark:text-[#a4ac86]">
                    {{ formatEventType(event.type) }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(event.created_at) }}</span>
                </div>
                <div class="text-sm">
                  <a :href="`https://github.com/${event.repo.name}`" target="_blank" class="hover:underline font-medium break-all text-gray-800 dark:text-gray-200 hover:text-[#2d4a2b] dark:hover:text-[#a4ac86] transition-colors">
                    {{ event.repo.name }}
                  </a>
                </div>
                <div v-if="event.payload.commits" class="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-black/20 p-2 rounded border border-gray-200/50 dark:border-white/5">
                  <div v-for="commit in event.payload.commits.slice(0, 2)" :key="commit.sha" class="truncate">
                    - {{ commit.message }}
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
