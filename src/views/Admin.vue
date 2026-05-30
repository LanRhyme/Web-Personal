<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import pinnedItemsData from '../data/pinned-items.json';
import projectsData from '../data/projects.json';
import commissionsData from '../data/commissions.json';
import worksData from '../data/works.json';
import worksSectionData from '../data/works_section.json';
import { getGitHubConfig, saveGitHubConfig, updateFile } from '../services/github';

const DRAFT_KEY = 'admin_draft_data';

const route = useRoute();

// Authentication
const isAuthenticated = ref(false);
const password = ref('');
const loginError = ref(false);
const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin888';

// GitHub Config
const showSettings = ref(false);
const githubConfig = ref({
  token: import.meta.env.VITE_GITHUB_TOKEN || '',
  owner: import.meta.env.VITE_GITHUB_OWNER || '',
  repo: import.meta.env.VITE_GITHUB_REPO || '',
  branch: 'main'
});

const isAdmin = computed(() => route.path === '/admin');

// Mobile Sidebar Logic
const isSidebarOpen = ref(false);
const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
};

const checkAuth = () => {
  if (password.value === adminPassword) {
    isAuthenticated.value = true;
    localStorage.setItem('isAdminAuthenticated', 'true');
    loginError.value = false;
  } else {
    loginError.value = true;
  }
};

const logout = () => {
  isAuthenticated.value = false;
  localStorage.removeItem('isAdminAuthenticated');
  password.value = '';
};

onMounted(() => {
  if (localStorage.getItem('isAdminAuthenticated') === 'true') {
    isAuthenticated.value = true;
  }
  const savedConfig = getGitHubConfig();
  if (savedConfig) {
    githubConfig.value = savedConfig;
  }
});

const saveSettings = () => {
  saveGitHubConfig(githubConfig.value);
  showSettings.value = false;
  alert('配置已保存！');
};

// Upload Logic
const isUploading = ref(false);
const uploadImage = async (file: File, folder: string): Promise<string> => {
  const reader = new FileReader();
  
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      const base64 = reader.result as string;
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${folder}/${Date.now()}-${safeName}`;
      
      if (isGithubConfigured.value) {
        try {
          isUploading.value = true;
          const content = base64.replace(/^data:image\/\w+;base64,/, "");
          const path = `public/${filename}`;
          await updateFile(path, content, `Upload ${filename}`, githubConfig.value, true);
          resolve(`/${filename}`);
        } catch (e) {
          console.error(e);
          reject('GitHub 上传失败: ' + e);
        } finally {
          isUploading.value = false;
        }
      } else {
        try {
          isUploading.value = true;
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filepath: filename, content: base64 })
          });
          
          if (res.ok) {
            const json = await res.json();
            resolve(json.path);
          } else {
            reject('上传失败');
          }
        } catch (e) {
          reject(e);
        } finally {
          isUploading.value = false;
        }
      }
    };
    reader.readAsDataURL(file);
  });
};

const handleFileUpload = async (event: Event, item: any, key: string, folder: string) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  
  try {
    const path = await uploadImage(file, folder);
    item[key] = path;
  } catch (e) {
    alert('上传失败: ' + e);
    console.error(e);
  } finally {
    input.value = ''; 
  }
};

// Tabs
const activeTab = ref('pinned');
const tabs = [
  { id: 'pinned', name: '首屏推荐', icon: 'fa-thumbtack', desc: '首页精选卡片管理', file: 'pinned-items.json' },
  { id: 'projects', name: '项目案例', icon: 'fa-code', desc: '主要代码工程展示', file: 'projects.json' },
  { id: 'commissions', name: '约稿信息', icon: 'fa-pencil-alt', desc: '定价与服务说明', file: 'commissions.json' },
  { id: 'works', name: '个人图库', icon: 'fa-image', desc: '单次上传的作品', file: 'works.json' },
  { id: 'works_section', name: '作品合集', icon: 'fa-folder-open', desc: '对作品进行分类归纳', file: 'works_section.json' },
  { id: 'articles', name: '文章管理', icon: 'fa-feather-alt', desc: '博客文章发布与管理', file: 'articles' }
];

const currentTabInfo = computed(() => tabs.find(t => t.id === activeTab.value));

const loadDraftData = () => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch {
            return null;
        }
    }
    return null;
};

const saveDraftData = () => {
    const draft = {
        pinnedItems: pinnedItems.value,
        projects: projects.value,
        commissions: commissions.value,
        works: works.value,
        worksSections: worksSections.value,
        isBusinessOpen: isBusinessOpen.value
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
};

const clearDraftData = () => {
    localStorage.removeItem(DRAFT_KEY);
};

const draftData = loadDraftData();

const pinnedItems = ref(draftData?.pinnedItems || [...pinnedItemsData]);
const projects = ref(draftData?.projects || [...projectsData]);
const commissions = ref(draftData?.commissions || [...commissionsData.priceList]);
const works = ref(draftData?.works || [...worksData]);
const worksSections = ref(draftData?.worksSections || [...worksSectionData]);
const isBusinessOpen = ref(draftData?.isBusinessOpen ?? (commissionsData.isBusinessOpen !== undefined ? commissionsData.isBusinessOpen : true));

watch([pinnedItems, projects, commissions, works, worksSections, isBusinessOpen], saveDraftData, { deep: true });

const isGithubConfigured = computed(() => !!githubConfig.value.token && !!githubConfig.value.owner && !!githubConfig.value.repo);

const isPublishing = ref(false);

const publishAllChanges = async () => {
    if (!isGithubConfigured.value) {
        alert('请先配置 GitHub 设置！');
        showSettings.value = true;
        return;
    }
    
    if (!confirm('确认发布所有修改到生产环境吗？')) return;

    try {
        isPublishing.value = true;
        
        const filesToPublish = [
            { filename: 'pinned-items.json', data: pinnedItems.value },
            { filename: 'projects.json', data: projects.value },
            { filename: 'commissions.json', data: { isBusinessOpen: isBusinessOpen.value, priceList: commissions.value } },
            { filename: 'works.json', data: works.value },
            { filename: 'works_section.json', data: worksSections.value }
        ];
        
        for (const file of filesToPublish) {
            const content = JSON.stringify(file.data, null, 2);
            const path = `src/data/${file.filename}`;
            await updateFile(path, content, `Admin: 更新 ${file.filename}`, githubConfig.value);
        }
        
        clearDraftData();
        alert('所有修改已成功发布！');
    } catch (e) {
        console.error(e);
        alert('发布失败: ' + e);
    } finally {
        isPublishing.value = false;
    }
};

const resolveImg = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return path.startsWith('/') ? path : '/' + path;
};

// CRUD Actions
const addPinnedItem = () => pinnedItems.value.push({ title: '新项', description: '描述', link: '' });
const removePinnedItem = (index: number) => pinnedItems.value.splice(index, 1);
const addProject = () => projects.value.unshift({ image: '', title: '新项目', description: '描述', tags: [], live_url: '', source_url: '' });
const removeProject = (index: number) => projects.value.splice(index, 1);
const addCommission = () => commissions.value.push({ title: '新约稿项', images: [], price: '¥ 0', description: '描述', requirements: '要求' });
const removeCommission = (index: number) => commissions.value.splice(index, 1);
const addWork = () => works.value.unshift({ id: `work-${Date.now()}`, image: '', title: '', description: '新作品' });
const removeWork = (index: number) => works.value.splice(index, 1);
const addWorksSection = () => worksSections.value.push({ id: `section-${Date.now()}`, title: '新系列', description: '描述', thumbnail: '', work_ids: [] });
const removeWorksSection = (index: number) => worksSections.value.splice(index, 1);

// Reordering Logic
const moveUp = (list: any[], index: number) => {
    if (index > 0) {
        const item = list.splice(index, 1)[0];
        list.splice(index - 1, 0, item);
    }
};

const moveDown = (list: any[], index: number) => {
    if (index < list.length - 1) {
        const item = list.splice(index, 1)[0];
        list.splice(index + 1, 0, item);
    }
};

const editingSectionId = ref<string | null>(null);
const toggleWorkInSection = (sectionIndex: number, workId: string) => {
  const section = worksSections.value[sectionIndex];
  if (!section) return;
  const idx = section.work_ids.indexOf(workId);
  if (idx === -1) section.work_ids.push(workId);
  else section.work_ids.splice(idx, 1);
};

// Article Editor State
const articleForm = ref({
  title: '',
  slug: '',
  summary: '',
  content: '',
  tags: '',
  category: '',
  cover: '',
  hidden: false
});

const articleImages = ref<{ id: string; previewUrl: string; file?: File }[]>([]);
const articleCoverPreview = ref<string | null>(null);
const isArticlePublishing = ref(false);
const existingArticles = ref<{ slug: string; title: string; date: string }[]>([]);
const isLoadingArticles = ref(false);
const isDeletingArticle = ref(false);

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '');
};

const handleArticleTitleChange = () => {
  if (!articleForm.value.slug) {
    articleForm.value.slug = generateSlug(articleForm.value.title);
  }
};

const handleArticleCoverUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    articleCoverPreview.value = e.target?.result as string;
    articleForm.value.cover = file.name;
  };
  reader.readAsDataURL(file);
};

const getArticleCoverUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? path : '/' + path;
};

const loadArticlesList = async () => {
  isLoadingArticles.value = true;
  try {
    const res = await fetch('/blogs/index.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      existingArticles.value = Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.error('Failed to load articles:', e);
    existingArticles.value = [];
  } finally {
    isLoadingArticles.value = false;
  }
};

const publishArticle = async () => {
  if (!isGithubConfigured.value) {
    alert('请先配置 GitHub 设置！');
    showSettings.value = true;
    return;
  }

  if (!articleForm.value.title || !articleForm.value.slug) {
    alert('请填写标题和slug！');
    return;
  }

  if (!confirm('确认发布文章吗？')) return;

  isArticlePublishing.value = true;

  try {
    const slug = articleForm.value.slug;
    const basePath = `public/blogs/${slug}`;
    const treeItems: any[] = [];

    const dateStr = new Date().toISOString().split('T')[0];

    const config = {
      title: articleForm.value.title,
      summary: articleForm.value.summary,
      date: dateStr,
      tags: articleForm.value.tags.split(',').map(t => t.trim()).filter(Boolean),
      category: articleForm.value.category,
      cover: articleForm.value.cover,
      hidden: articleForm.value.hidden
    };

    const configBlob = await createBlob(githubConfig.value.token, githubConfig.value.owner, githubConfig.value.repo, btoa(unescape(encodeURIComponent(JSON.stringify(config, null, 2)))), 'base64');
    treeItems.push({
      path: `${basePath}/config.json`,
      mode: '100644',
      type: 'blob',
      sha: configBlob.sha
    });

    const mdBlob = await createBlob(githubConfig.value.token, githubConfig.value.owner, githubConfig.value.repo, btoa(unescape(encodeURIComponent(articleForm.value.content))), 'base64');
    treeItems.push({
      path: `${basePath}/index.md`,
      mode: '100644',
      type: 'blob',
      sha: mdBlob.sha
    });

    const refRes = await fetch(`https://api.github.com/repos/${githubConfig.value.owner}/${githubConfig.value.repo}/git/refs/heads/${githubConfig.value.branch}`, {
      headers: { Authorization: `token ${githubConfig.value.token}` }
    });
    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    const treeRes = await fetch(`https://api.github.com/repos/${githubConfig.value.owner}/${githubConfig.value.repo}/git/trees`, {
      method: 'POST',
      headers: {
        Authorization: `token ${githubConfig.value.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base_tree: latestCommitSha,
        tree: treeItems
      })
    });
    const treeData = await treeRes.json();

    const commitRes = await fetch(`https://api.github.com/repos/${githubConfig.value.owner}/${githubConfig.value.repo}/git/commits`, {
      method: 'POST',
      headers: {
        Authorization: `token ${githubConfig.value.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Admin: 发布文章 ${slug}`,
        tree: treeData.sha,
        parents: [latestCommitSha]
      })
    });
    const commitData = await commitRes.json();

    await fetch(`https://api.github.com/repos/${githubConfig.value.owner}/${githubConfig.value.repo}/git/refs/heads/${githubConfig.value.branch}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${githubConfig.value.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sha: commitData.sha
      })
    });

    const indexRes = await fetch(`https://api.github.com/repos/${githubConfig.value.owner}/${githubConfig.value.repo}/contents/public/blogs/index.json?ref=${githubConfig.value.branch}`, {
      headers: { Authorization: `token ${githubConfig.value.token}` }
    });
    let existingIndex: any[] = [];
    try {
      const indexData = await indexRes.json();
      if (indexData.content) {
        existingIndex = JSON.parse(atob(indexData.content));
      }
    } catch (e) {
      console.error('Failed to parse index.json:', e);
    }

    const newArticleEntry = {
      slug: slug,
      title: articleForm.value.title,
      date: dateStr,
      summary: articleForm.value.summary,
      tags: articleForm.value.tags.split(',').map(t => t.trim()).filter(Boolean),
      category: articleForm.value.category,
      cover: articleForm.value.cover,
      hidden: articleForm.value.hidden
    };

    const updatedIndex = [...existingIndex.filter((a: any) => a.slug !== slug), newArticleEntry];
    const updatedIndexContent = JSON.stringify(updatedIndex, null, 2);

    const indexBlob = await createBlob(githubConfig.value.token, githubConfig.value.owner, githubConfig.value.repo, btoa(unescape(encodeURIComponent(updatedIndexContent))), 'base64');

    const indexTreeRes = await fetch(`https://api.github.com/repos/${githubConfig.value.owner}/${githubConfig.value.repo}/git/trees`, {
      method: 'POST',
      headers: {
        Authorization: `token ${githubConfig.value.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base_tree: commitData.sha,
        tree: [{
          path: 'public/blogs/index.json',
          mode: '100644',
          type: 'blob',
          sha: indexBlob.sha
        }]
      })
    });
    const indexTreeData = await indexTreeRes.json();

    const indexCommitRes = await fetch(`https://api.github.com/repos/${githubConfig.value.owner}/${githubConfig.value.repo}/git/commits`, {
      method: 'POST',
      headers: {
        Authorization: `token ${githubConfig.value.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Admin: 更新文章索引`,
        tree: indexTreeData.sha,
        parents: [commitData.sha]
      })
    });
    const indexCommitData = await indexCommitRes.json();

    await fetch(`https://api.github.com/repos/${githubConfig.value.owner}/${githubConfig.value.repo}/git/refs/heads/${githubConfig.value.branch}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${githubConfig.value.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sha: indexCommitData.sha
      })
    });

    articleForm.value = { title: '', slug: '', summary: '', content: '', tags: '', category: '', cover: '', hidden: false };
    articleCoverPreview.value = null;
    await loadArticlesList();

    alert('文章发布成功！');
  } catch (e: any) {
    console.error('Failed to publish article:', e);
    alert('发布失败: ' + (e?.message || e));
  } finally {
    isArticlePublishing.value = false;
  }
};

const createBlob = async (token: string, owner: string, repo: string, content: string, encoding: string) => {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content, encoding })
  });
  return await res.json();
};

const deleteArticle = async (slug: string) => {
  if (!isGithubConfigured.value) {
    alert('请先配置 GitHub 设置！');
    showSettings.value = true;
    return;
  }

  if (!confirm(`确认删除文章 "${slug}" 吗？此操作不可恢复。`)) return;

  isDeletingArticle.value = true;

  try {
    const refRes = await fetch(`https://api.github.com/repos/${githubConfig.value.owner}/${githubConfig.value.repo}/git/refs/heads/${githubConfig.value.branch}`, {
      headers: { Authorization: `token ${githubConfig.value.token}` }
    });
    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    const indexRes = await fetch(`https://api.github.com/repos/${githubConfig.value.owner}/${githubConfig.value.repo}/contents/public/blogs/index.json?ref=${githubConfig.value.branch}`, {
      headers: { Authorization: `token ${githubConfig.value.token}` }
    });
    let existingIndex: any[] = [];
    try {
      const indexData = await indexRes.json();
      if (indexData.content) {
        existingIndex = JSON.parse(atob(indexData.content));
      }
    } catch (e) {
      console.error('Failed to parse index.json:', e);
    }

    const updatedIndex = existingIndex.filter((a: any) => a.slug !== slug);
    const updatedIndexContent = JSON.stringify(updatedIndex, null, 2);

    const indexBlob = await createBlob(githubConfig.value.token, githubConfig.value.owner, githubConfig.value.repo, btoa(unescape(encodeURIComponent(updatedIndexContent))), 'base64');

    const indexTreeRes = await fetch(`https://api.github.com/repos/${githubConfig.value.owner}/${githubConfig.value.repo}/git/trees`, {
      method: 'POST',
      headers: {
        Authorization: `token ${githubConfig.value.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base_tree: latestCommitSha,
        tree: [{
          path: 'public/blogs/index.json',
          mode: '100644',
          type: 'blob',
          sha: indexBlob.sha
        }]
      })
    });
    const indexTreeData = await indexTreeRes.json();

    const indexCommitRes = await fetch(`https://api.github.com/repos/${githubConfig.value.owner}/${githubConfig.value.repo}/git/commits`, {
      method: 'POST',
      headers: {
        Authorization: `token ${githubConfig.value.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Admin: 删除文章 ${slug}`,
        tree: indexTreeData.sha,
        parents: [latestCommitSha]
      })
    });
    const indexCommitData = await indexCommitRes.json();

    await fetch(`https://api.github.com/repos/${githubConfig.value.owner}/${githubConfig.value.repo}/git/refs/heads/${githubConfig.value.branch}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${githubConfig.value.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sha: indexCommitData.sha
      })
    });

    await loadArticlesList();
    alert('文章删除成功！');
  } catch (e: any) {
    console.error('Failed to delete article:', e);
    alert('删除失败: ' + (e?.message || e));
  } finally {
    isDeletingArticle.value = false;
  }
};

onMounted(() => {
  if (isAuthenticated.value) {
    loadArticlesList();
  }
});

watch(isAuthenticated, (newVal) => {
  if (newVal) {
    loadArticlesList();
  }
});
</script>

<template>
  <div class="min-h-screen w-full bg-[var(--color-bg)] transition-colors duration-500 font-sans overflow-x-hidden">
    
    <!-- Auth Screen -->
    <transition name="fade">
      <div v-if="!isAuthenticated" class="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--color-bg)]">
        <div class="cyber-glass max-w-md w-full mx-4 p-6 md:p-12 text-center">
          <div class="w-12 h-12 md:w-16 md:h-16 bg-[var(--color-brand)] text-white flex items-center justify-center text-xl md:text-2xl mx-auto mb-6 md:mb-8">
              <i class="fas fa-fingerprint"></i>
          </div>
          <h2 class="text-2xl md:text-3xl font-black text-[var(--color-primary)] mb-6 md:mb-8 tracking-tight">管理后台登入</h2>
          <input 
            type="password" 
            v-model="password" 
            @keyup.enter="checkAuth"
            placeholder="请输入管理员密码"
            class="input-terminal mb-6"
          />
          <button @click="checkAuth" class="btn-terminal w-full py-4 text-xs font-bold tracking-widest uppercase">解锁控制台</button>
          <p v-if="loginError" class="text-red-500 text-xs font-bold mt-4 uppercase tracking-widest">身份验证失败</p>
        </div>
      </div>
    </transition>

    <div v-if="isAuthenticated" class="flex flex-col lg:flex-row min-h-screen relative">
      
      <!-- Mobile Navbar Toggle -->
      <div class="lg:hidden fixed top-4 right-4 z-[60]">
        <button @click="toggleSidebar" class="btn-terminal !p-0 w-10 h-10 flex items-center justify-center">
          <i class="fas" :class="isSidebarOpen ? 'fa-times' : 'fa-bars'"></i>
        </button>
      </div>

      <!-- Sidebar -->
      <aside 
        class="fixed lg:sticky top-0 left-0 w-72 lg:w-80 h-screen admin-sidebar p-4 lg:p-6 z-50 flex flex-col transition-all duration-300"
        :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      >
        <div class="flex items-center gap-3 mb-6 lg:mb-10 px-2 mt-2 lg:mt-0">
            <div class="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center"><i class="fas fa-terminal text-[var(--color-brand)]"></i></div>
            <h1 class="text-lg lg:text-xl font-black text-[var(--color-primary)] tracking-tight">Console<span class="font-light opacity-50">.hub</span></h1>
        </div>

        <div class="mb-4 lg:mb-8 space-y-2 lg:space-y-3 px-2">
            <button @click="() => { publishAllChanges(); isSidebarOpen = false; }" :disabled="isPublishing" class="btn-terminal w-full flex items-center justify-center gap-2 lg:gap-3 py-3 lg:py-4 font-black text-[10px] lg:text-xs uppercase tracking-widest disabled:opacity-50">
                <i v-if="isPublishing" class="fas fa-sync fa-spin"></i>
                <i v-else class="fas fa-cloud-upload-alt"></i>
                {{ isPublishing ? '同步中...' : '发布到生产环境' }}
            </button>
            <button @click="() => {
                    activeTab === 'pinned' ? addPinnedItem() : activeTab === 'projects' ? addProject() : activeTab === 'commissions' ? addCommission() : activeTab === 'works' ? addWork() : addWorksSection();
                    isSidebarOpen = false;
                }" class="btn-terminal w-full flex items-center justify-center gap-2 lg:gap-3 py-3 lg:py-4 font-black text-[10px] lg:text-xs uppercase tracking-widest">
                <i class="fas fa-plus-circle"></i> 新增记录
            </button>
        </div>

        <div class="text-[10px] font-black text-[var(--color-secondary)] opacity-40 uppercase tracking-[0.2em] mb-2 lg:mb-4 px-4">Workspace</div>
        
        <nav class="space-y-1 lg:space-y-2 mb-6 lg:mb-10 overflow-y-auto admin-scrollbar pr-2 flex-1">
            <button 
                v-for="tab in tabs" 
                :key="tab.id"
                @click="() => { activeTab = tab.id; isSidebarOpen = false; }"
                class="w-full admin-nav-item !p-2 lg:!p-3"
                :class="activeTab === tab.id ? 'active' : ''"
            >
                <div class="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center transition-all">
                    <i class="fas text-sm lg:text-base" :class="tab.icon"></i>
                </div>
                <div class="text-left">
                    <p class="font-bold text-xs lg:text-sm">{{ tab.name }}</p>
                    <p class="text-[9px] lg:text-[10px] opacity-60 uppercase font-bold tracking-widest">{{ tab.file.split('.')[0] }}</p>
                </div>
            </button>
        </nav>

        <div class="space-y-2 lg:space-y-3 px-2 border-t border-[var(--color-border)] pt-4 lg:pt-8">
            <button @click="showSettings = true" class="btn-terminal w-full flex items-center gap-2 lg:gap-3 text-[10px] lg:text-xs font-bold !border-0 !p-0 text-[var(--color-secondary)] hover:text-[var(--color-brand)] transition-colors">
                <i class="fas fa-sliders-h"></i> 存储配置
            </button>
            <button @click="logout" class="btn-terminal w-full flex items-center gap-2 lg:gap-3 text-[10px] lg:text-xs font-bold !border-0 !p-0 text-red-400 hover:text-red-500 transition-colors">
                <i class="fas fa-sign-out-alt"></i> 退出登录
            </button>
        </div>
      </aside>

      <!-- Mobile Overlay -->
      <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"></div>

      <!-- Main Content Area -->
      <main class="flex-grow flex flex-col relative min-w-0">
        <div class="flex-grow overflow-y-auto px-4 md:px-12 pt-14 lg:pt-12 pb-20 lg:pb-32">
            <div class="mb-8 lg:mb-12">
                <div class="flex items-center gap-2 lg:gap-3 mb-2">
                    <i class="fas" :class="currentTabInfo?.icon + ' text-[var(--color-brand)] text-lg lg:text-xl'"></i>
                    <h2 class="text-2xl lg:text-4xl font-black text-[var(--color-primary)] tracking-tight">{{ currentTabInfo?.name }}</h2>
                </div>
                <p class="text-[var(--color-secondary)] font-medium max-w-2xl text-xs lg:text-base">{{ currentTabInfo?.desc }} — 管理并排序您的资产。</p>
            </div>

            <div v-if="isUploading" class="fixed bottom-4 right-4 lg:bottom-12 lg:right-12 z-50 bg-[var(--color-brand)] text-white px-4 py-2 lg:px-6 lg:py-3 rounded-full shadow-2xl flex items-center gap-3 lg:gap-4 animate-bounce">
                <i class="fas fa-shield-virus fa-spin"></i>
                <span class="text-[10px] lg:text-xs font-bold uppercase tracking-widest">正在上传资产...</span>
            </div>

            <div class="grid grid-cols-1 gap-6 max-w-6xl">
                
                <!-- Pinned Items -->
                <template v-if="activeTab === 'pinned'">
                    <div v-for="(item, index) in pinnedItems" :key="index" class="admin-card group relative animate-fade-in-up">
                        <div class="absolute top-3 right-3 md:top-4 md:right-4 flex gap-1 md:gap-2 transition-opacity z-20">
                            <button @click="moveUp(pinnedItems, index)" class="w-7 h-7 md:w-8 md:h-8 bg-white/10 text-[var(--color-primary)] transition-all hover:bg-[var(--color-brand)] hover:text-white text-xs"><i class="fas fa-arrow-up"></i></button>
                            <button @click="moveDown(pinnedItems, index)" class="w-7 h-7 md:w-8 md:h-8 bg-white/10 text-[var(--color-primary)] transition-all hover:bg-[var(--color-brand-secondary)] hover:text-white text-xs"><i class="fas fa-arrow-down"></i></button>
                            <button @click="removePinnedItem(index)" class="w-7 h-7 md:w-8 md:h-8 bg-red-400/10 text-red-500 transition-all hover:bg-red-400 hover:text-white text-xs"><i class="fas fa-trash"></i></button>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-8 md:pt-0">
                            <div class="input-terminal-group"><label>标题</label><input v-model="item.title" class="input-terminal" /></div>
                            <div class="input-terminal-group"><label>描述</label><input v-model="item.description" class="input-terminal" /></div>
                            <div class="input-terminal-group"><label>跳转链接</label><input v-model="item.link" class="input-terminal font-mono text-[10px]" /></div>
                        </div>
                    </div>
                </template>

                <!-- Projects -->
                <template v-if="activeTab === 'projects'">
                    <div v-for="(project, index) in projects" :key="index" class="admin-card group animate-fade-in-up relative flex flex-col md:flex-row gap-4 md:gap-8">
                        <div class="absolute top-3 right-3 md:top-4 md:right-4 flex gap-1 md:gap-2 transition-opacity z-20">
                            <button @click="moveUp(projects, index)" class="w-8 h-8 md:w-10 md:h-10 bg-white/10 text-[var(--color-primary)] transition-all hover:bg-[var(--color-brand)] hover:text-white"><i class="fas fa-arrow-up text-xs md:text-sm"></i></button>
                            <button @click="moveDown(projects, index)" class="w-8 h-8 md:w-10 md:h-10 bg-white/10 text-[var(--color-primary)] transition-all hover:bg-[var(--color-brand)] hover:text-white"><i class="fas fa-arrow-down text-xs md:text-sm"></i></button>
                            <button @click="removeProject(index)" class="w-8 h-8 md:w-10 md:h-10 bg-red-500/10 text-red-500 transition-all hover:bg-red-500 hover:text-white"><i class="fas fa-trash text-xs md:text-sm"></i></button>
                        </div>
                        <div class="w-full md:w-64 flex-shrink-0 pt-8 md:pt-0">
                            <div class="aspect-video bg-[var(--color-bg)] border border-dashed border-[var(--color-border)] relative group/img">
                                <img v-if="project.image" :src="resolveImg(project.image)" loading="lazy" decoding="async" class="w-full h-full object-cover" />
                                <div v-else class="w-full h-full flex flex-col items-center justify-center text-[var(--color-secondary)] opacity-30"><i class="fas fa-image text-2xl md:text-3xl mb-2"></i><span class="text-[10px] font-bold">PREVIEW</span></div>
                                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <label class="btn-terminal !py-2 !px-4 text-[10px] cursor-pointer">
                                        更新图片
                                        <input type="file" class="hidden" accept="image/*" @change="(e) => handleFileUpload(e, project, 'image', 'img-projects')" />
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="flex-grow space-y-4 md:space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="input-terminal-group"><label>项目标题</label><input v-model="project.title" class="input-terminal text-lg font-bold" /></div>
                                <div class="input-terminal-group"><label>技术栈 (逗号分隔)</label><input :value="project.tags.join(', ')" @input="(e) => project.tags = (e.target as HTMLInputElement).value.split(',').map(t => t.trim())" class="input-terminal" /></div>
                            </div>
                            <div class="input-terminal-group"><label>详情描述</label><textarea v-model="project.description" class="input-terminal h-24 pt-4"></textarea></div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="input-terminal-group"><label>预览链接 (live_url)</label><input v-model="project.live_url" class="input-terminal font-mono text-xs" placeholder="https://example.com" /></div>
                                <div class="input-terminal-group"><label>源码链接 (source_url)</label><input v-model="project.source_url" class="input-terminal font-mono text-xs" placeholder="https://github.com/..." /></div>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- Commissions -->
                <template v-if="activeTab === 'commissions'">
                    <div class="admin-card group animate-fade-in-up p-6 mb-6">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-2xl flex items-center justify-center transition-all" :class="isBusinessOpen ? 'bg-[var(--color-brand)]/20 text-[var(--color-brand)]' : 'bg-red-500/20 text-red-500'">
                                    <i class="fas" :class="isBusinessOpen ? 'fa-store' : 'fa-store-slash'"></i>
                                </div>
                                <div>
                                    <h4 class="font-bold text-[var(--color-primary)]">营业状态</h4>
                                    <p class="text-xs text-[var(--color-secondary)]">{{ isBusinessOpen ? '当前营业中，橱窗正常展示' : '当前暂停营业，橱窗将隐藏' }}</p>
                                </div>
                            </div>
                            <button 
                                @click="isBusinessOpen = !isBusinessOpen" 
                                class="relative w-16 h-8 rounded-full transition-all duration-300 shadow-inner"
                                :class="isBusinessOpen ? 'bg-[var(--color-brand)]' : 'bg-gray-400'"
                            >
                                <span 
                                    class="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-300"
                                    :class="isBusinessOpen ? 'left-9' : 'left-1'"
                                ></span>
                            </button>
                        </div>
                    </div>
                    <div v-for="(comm, index) in commissions" :key="index" class="admin-card group animate-fade-in-up p-4 md:p-8 relative">
                        <div class="absolute top-3 right-3 md:top-4 md:right-4 flex gap-1 md:gap-2 transition-opacity z-20">
                            <button @click="moveUp(commissions, index)" class="w-8 h-8 md:w-10 md:h-10 bg-white/10 text-[var(--color-primary)] transition-all hover:bg-[var(--color-brand)] hover:text-white"><i class="fas fa-arrow-up text-xs md:text-sm"></i></button>
                            <button @click="moveDown(commissions, index)" class="w-8 h-8 md:w-10 md:h-10 bg-white/10 text-[var(--color-primary)] transition-all hover:bg-[var(--color-brand)] hover:text-white"><i class="fas fa-arrow-down text-xs md:text-sm"></i></button>
                            <button @click="removeCommission(index)" class="w-8 h-8 md:w-10 md:h-10 bg-red-500/10 text-red-500 transition-all hover:bg-red-500 hover:text-white"><i class="fas fa-trash text-xs md:text-sm"></i></button>
                        </div>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 pt-8 md:pt-0">
                            <div class="space-y-6">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="input-terminal-group"><label>服务名称</label><input v-model="comm.title" class="input-terminal" /></div>
                                    <div class="input-terminal-group"><label>定价说明</label><input v-model="comm.price" class="input-terminal font-bold text-[var(--color-brand)]" /></div>
                                </div>
                                <div class="input-terminal-group"><label>需求概括</label><input v-model="comm.requirements" class="input-terminal" /></div>
                                <div class="input-terminal-group"><label>服务详情</label><textarea v-model="comm.description" class="input-terminal h-32 pt-4"></textarea></div>
                            </div>
                            <div class="space-y-4">
                                <label class="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand)]">预览图示</label>
                                <div class="grid grid-cols-3 gap-3">
                                    <div v-for="(img, i) in comm.images" :key="i" class="aspect-square rounded-2xl overflow-hidden bg-[var(--color-bg)] group/img relative shadow-sm">
                                        <img :src="resolveImg(img)" loading="lazy" decoding="async" class="w-full h-full object-cover" />
                                        <button @click="comm.images.splice(i, 1)" class="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-[8px]"><i class="fas fa-times"></i></button>
                                    </div>
                                    <label class="aspect-square rounded-2xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center text-[var(--color-secondary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] cursor-pointer transition-all">
                                        <i class="fas fa-plus-circle text-xl"></i>
                                        <input type="file" class="hidden" accept="image/*" @change="(e) => {
                                            const file = (e.target as HTMLInputElement).files?.[0];
                                            if(file) uploadImage(file, 'img-commissions').then(path => comm.images.push(path));
                                        }" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- Gallery -->
                <template v-if="activeTab === 'works'">
                    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                        <div v-for="(work, index) in works" :key="work.id" class="admin-card group relative animate-fade-in-up !p-3 md:!p-4">
                            <div class="absolute top-2 right-2 md:top-3 md:right-3 flex flex-col gap-1 z-20">
                                <button @click="moveUp(works, index)" class="w-6 h-6 md:w-7 md:h-7 bg-white/20 text-white hover:bg-[var(--color-brand)]"><i class="fas fa-chevron-up text-[10px] md:text-xs"></i></button>
                                <button @click="moveDown(works, index)" class="w-6 h-6 md:w-7 md:h-7 bg-white/20 text-white hover:bg-[var(--color-brand)]"><i class="fas fa-chevron-down text-[10px] md:text-xs"></i></button>
                                <button @click="removeWork(index)" class="w-6 h-6 md:w-7 md:h-7 bg-red-500 text-white"><i class="fas fa-times text-[10px] md:text-xs"></i></button>
                            </div>
                            <div class="aspect-square bg-[var(--color-bg)] relative mb-3 md:mb-4">
                                <img v-if="work.image" :src="resolveImg(work.image)" loading="lazy" decoding="async" class="w-full h-full object-cover" />
                                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <label class="cursor-pointer text-white p-4">
                                        <i class="fas fa-cloud-upload-alt text-2xl"></i>
                                        <input type="file" class="hidden" @change="(e) => handleFileUpload(e, work, 'image', 'img-works')" />
                                    </label>
                                </div>
                            </div>
                            <input v-model="work.title" placeholder="标题" class="input-terminal !text-xs font-bold mb-2" />
                            <div class="flex justify-between items-center mt-2">
                                <p class="text-[9px] opacity-40 font-mono">{{ work.id }}</p>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- Collections -->
                <template v-if="activeTab === 'works_section'">
                     <div v-for="(section, index) in worksSections" :key="section.id" class="admin-card group animate-fade-in-up">
                        <div class="flex flex-col md:flex-row gap-4 md:gap-8">
                            <div class="w-24 md:w-32 flex-shrink-0 mx-auto md:mx-0">
                                <div class="aspect-square bg-[var(--color-bg)] relative border border-[var(--color-border)]">
                                    <img v-if="section.thumbnail" :src="resolveImg(section.thumbnail)" loading="lazy" decoding="async" class="w-full h-full object-cover" />
                                    <label class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                        <i class="fas fa-camera text-white"></i>
                                        <input type="file" class="hidden" @change="(e) => handleFileUpload(e, section, 'thumbnail', 'img-works')" />
                                    </label>
                                </div>
                            </div>
                            <div class="flex-grow">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                                    <div class="input-terminal-group"><label>合集名称</label><input v-model="section.title" class="input-terminal font-black text-lg md:text-xl" /></div>
                                    <div class="input-terminal-group"><label>引用键名</label><input v-model="section.id" class="input-terminal font-mono text-xs opacity-60" /></div>
                                </div>
                                <div class="input-terminal-group"><label>简介说明</label><textarea v-model="section.description" class="input-terminal h-16 md:h-20 pt-3 md:pt-4"></textarea></div>
                            </div>
                            <div class="flex flex-row md:flex-col gap-2 justify-end md:justify-start">
                                 <button @click="removeWorksSection(index)" class="btn-terminal !text-red-400 !border-red-400/20 hover:!bg-red-400 hover:!text-white py-2 shadow-sm"><i class="fas fa-trash"></i></button>
                                 <button @click="editingSectionId = editingSectionId === section.id ? null : section.id" 
                                         class="btn-terminal py-2" :class="editingSectionId === section.id ? 'btn-terminal text-white' : ''">
                                     <i class="fas fa-layer-group"></i> 管理
                                 </button>
                            </div>
                        </div>

                        <div v-if="editingSectionId === section.id" class="mt-8 pt-8 border-t border-[var(--color-border)] animate-fade-in">
                             <div class="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3 max-h-96 overflow-y-auto pr-4 admin-scrollbar">
                                 <div v-for="work in works" :key="work.id" 
                                      @click="toggleWorkInSection(index, work.id)"
                                      class="aspect-square rounded-xl overflow-hidden cursor-pointer relative transition-all"
                                      :class="section.work_ids.includes(work.id) ? 'ring-4 ring-[var(--color-brand)] scale-95 opacity-100' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'"
                                 >
                                      <img :src="resolveImg(work.image)" loading="lazy" decoding="async" class="w-full h-full object-cover" />
                                      <div v-if="section.work_ids.includes(work.id)" class="absolute inset-0 flex items-center justify-center bg-[var(--color-brand)]/20">
                                          <i class="fas fa-check-circle text-white text-2xl shadow-lg"></i>
                                      </div>
                                 </div>
                             </div>
                        </div>
                     </div>
                </template>

                <!-- Articles -->
                <template v-if="activeTab === 'articles'">
                    <div class="admin-card p-6 mb-6">
                        <h4 class="font-bold text-[var(--color-primary)] mb-4">撰写新文章</h4>
                        <div class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="input-terminal-group">
                                    <label>标题</label>
                                    <input v-model="articleForm.title" @input="handleArticleTitleChange" class="input-terminal" placeholder="文章标题" />
                                </div>
                                <div class="input-terminal-group">
                                    <label>Slug (URL标识)</label>
                                    <input v-model="articleForm.slug" class="input-terminal font-mono text-xs" placeholder="my-article-slug" />
                                </div>
                            </div>
                            <div class="input-terminal-group">
                                <label>摘要</label>
                                <input v-model="articleForm.summary" class="input-terminal" placeholder="文章简要描述" />
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="input-terminal-group">
                                    <label>标签 (逗号分隔)</label>
                                    <input v-model="articleForm.tags" class="input-terminal" placeholder="vue, react, typescript" />
                                </div>
                                <div class="input-terminal-group">
                                    <label>分类</label>
                                    <input v-model="articleForm.category" class="input-terminal" placeholder="技术/生活/其他" />
                                </div>
                            </div>
                            <div class="input-terminal-group">
                                <label>封面图片 URL</label>
                                <div class="flex gap-4 items-start">
                                    <input v-model="articleForm.cover" class="input-terminal flex-grow" placeholder="/blogs/my-article/cover.png" />
                                    <label class="btn-terminal cursor-pointer">
                                        <i class="fas fa-upload mr-2"></i>上传
                                        <input type="file" class="hidden" accept="image/*" @change="handleArticleCoverUpload" />
                                    </label>
                                </div>
                                <div v-if="articleCoverPreview" class="mt-3 w-32 h-32 rounded-xl overflow-hidden bg-[var(--color-bg)]">
                                    <img :src="articleCoverPreview" loading="lazy" decoding="async" class="w-full h-full object-cover" />
                                </div>
                            </div>
                            <div class="input-terminal-group">
                                <label>Markdown 内容</label>
                                <textarea v-model="articleForm.content" class="input-terminal h-64 font-mono text-xs" placeholder="# 标题&#10;&#10;这里是文章内容，支持 Markdown 语法..."></textarea>
                            </div>
                            <div class="flex items-center gap-4">
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" v-model="articleForm.hidden" class="w-4 h-4 rounded accent-[var(--color-brand)]" />
                                    <span class="text-xs text-[var(--color-secondary)]">隐藏文章 (不显示在列表)</span>
                                </label>
                            </div>
                            <div class="flex justify-end gap-4 pt-4 border-t border-[var(--color-border)]">
                                <button @click="articleForm = { title: '', slug: '', summary: '', content: '', tags: '', category: '', cover: '', hidden: false }; articleCoverPreview = null;" class="btn-terminal">
                                    <i class="fas fa-times mr-2"></i>清空
                                </button>
                                <button @click="publishArticle" :disabled="isArticlePublishing" class="btn-terminal">
                                    <i v-if="isArticlePublishing" class="fas fa-sync fa-spin mr-2"></i>
                                    <i v-else class="fas fa-cloud-upload-alt mr-2"></i>
                                    {{ isArticlePublishing ? '发布中...' : '发布文章' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-if="isLoadingArticles" class="text-center py-8">
                        <i class="fas fa-spinner fa-spin text-[var(--color-brand)] text-xl"></i>
                    </div>

                    <div v-else-if="existingArticles.length > 0">
                        <h4 class="font-bold text-[var(--color-primary)] mb-4">已发布的文章</h4>
                        <div class="space-y-2">
                            <div v-for="article in existingArticles" :key="article.slug" class="admin-card !p-0 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                                <div class="flex-grow p-3 md:p-4">
                                    <h5 class="font-bold text-[var(--color-primary)] text-sm md:text-base">{{ article.title }}</h5>
                                    <div class="flex flex-wrap items-center gap-2 mt-1">
                                        <p class="text-[10px] text-[var(--color-secondary)] font-mono">{{ article.slug }}</p>
                                        <span class="text-[10px] text-[var(--color-secondary)]">{{ article.date }}</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2 px-3 pb-3 md:px-4 md:py-0 md:pr-4">
                                    <button @click="$router.push('/article/' + article.slug)" class="btn-terminal !py-2 !px-3 text-xs">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button @click="deleteArticle(article.slug)" :disabled="isDeletingArticle" class="btn-terminal !py-2 !px-3 text-xs text-red-400 hover:!bg-red-400 hover:!text-white">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center py-12 text-[var(--color-secondary)]">
                        <i class="fas fa-feather-alt text-4xl opacity-20 mb-4"></i>
                        <p>暂无已发布的文章</p>
                    </div>
                </template>

            </div>
        </div>
      </main>

       <!-- Settings Modal -->
    <transition name="fade">
        <div v-if="showSettings" class="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-xl px-4">
            <div class="cyber-glass max-w-lg w-full p-6 md:p-10 relative">
                <button @click="showSettings = false" class="absolute top-4 right-4 md:top-6 md:right-6 text-[var(--color-secondary)] hover:text-red-500"><i class="fas fa-times"></i></button>
                <h3 class="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[var(--color-primary)]">GitHub 存储配置</h3>
                <div class="space-y-4 md:space-y-6">
                    <div class="input-terminal-group">
                        <label>Token</label>
                        <input v-model="githubConfig.token" type="password" class="input-terminal" placeholder="ghp_xxxx" />
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div class="input-terminal-group"><label>Owner</label><input v-model="githubConfig.owner" class="input-terminal" /></div>
                        <div class="input-terminal-group"><label>Repo</label><input v-model="githubConfig.repo" class="input-terminal" /></div>
                    </div>
                    <button @click="saveSettings" class="btn-terminal w-full py-3 md:py-4 mt-3 md:mt-4">确认保存</button>
                </div>
            </div>
        </div>
    </transition>

    </div>
  </div>
</template>

<style scoped>
/* Admin页面显示鼠标指针 */
:deep(*) {
  cursor: auto !important;
}

:deep(a),
:deep(button),
:deep(.cursor-pointer),
:deep(input),
:deep(textarea),
:deep(select) {
  cursor: pointer !important;
}
</style>
