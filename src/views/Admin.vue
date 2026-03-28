<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import pinnedItemsData from '../data/pinned-items.json';
import projectsData from '../data/projects.json';
import commissionsData from '../data/commissions.json';
import worksData from '../data/works.json';
import worksSectionData from '../data/works_section.json';
import { getGitHubConfig, saveGitHubConfig, updateFile } from '../services/github';

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
  return new Promise(async (resolve, reject) => {
    const reader = new FileReader();
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
  { id: 'works_section', name: '作品合集', icon: 'fa-folder-open', desc: '对作品进行分类归纳', file: 'works_section.json' }
];

const currentTabInfo = computed(() => tabs.find(t => t.id === activeTab.value));

// Data State
const pinnedItems = ref([...pinnedItemsData]);
const projects = ref([...projectsData]);
const commissions = ref([...commissionsData.priceList]);
const works = ref([...worksData]);
const worksSections = ref([...worksSectionData]);
const isBusinessOpen = ref(commissionsData.isBusinessOpen !== undefined ? commissionsData.isBusinessOpen : true);

const isGithubConfigured = computed(() => !!githubConfig.value.token && !!githubConfig.value.owner && !!githubConfig.value.repo);

const getCurrentData = () => {
    switch (activeTab.value) {
        case 'pinned': return pinnedItems.value;
        case 'projects': return projects.value;
        case 'commissions': return { isBusinessOpen: isBusinessOpen.value, priceList: commissions.value };
        case 'works': return works.value;
        case 'works_section': return worksSections.value;
        default: return [];
    }
};

// Actions
const isPublishing = ref(false);

const publishChanges = async () => {
    if (!isGithubConfigured.value) {
        alert('请先配置 GitHub 设置！');
        showSettings.value = true;
        return;
    }
    
    if (!confirm('确认发布所有修改到生产环境吗？')) return;

    try {
        isPublishing.value = true;
        const filename = currentTabInfo.value?.file;
        if (!filename) throw new Error('未指定文件');
        
        const content = JSON.stringify(getCurrentData(), null, 2);
        const path = `src/data/${filename}`;
        
        await updateFile(path, content, `Admin: 更新 ${filename}`, githubConfig.value);
        alert('发布成功！');
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
</script>

<template>
  <div class="min-h-screen w-full bg-[var(--color-bg)] transition-colors duration-500 font-sans overflow-x-hidden">
    
    <!-- Auth Screen -->
    <transition name="fade">
      <div v-if="!isAuthenticated" class="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--color-bg)]">
        <div class="card max-w-md w-full mx-4 p-8 md:p-12 text-center animate-fade-in">
          <div class="w-16 h-16 rounded-2xl bg-[#35bfa0] text-white flex items-center justify-center text-2xl shadow-lg mx-auto mb-8">
              <i class="fas fa-fingerprint"></i>
          </div>
          <h2 class="text-3xl font-black text-[var(--color-primary)] mb-8 tracking-tight">管理后台登入</h2>
          <input 
            type="password" 
            v-model="password" 
            @keyup.enter="checkAuth"
            placeholder="请输入管理员密码"
            class="input-modern mb-6"
          />
          <button @click="checkAuth" class="btn-brand w-full py-4 text-xs font-bold tracking-widest uppercase">解锁控制台</button>
          <p v-if="loginError" class="text-red-500 text-xs font-bold mt-4 uppercase tracking-widest">身份验证失败</p>
        </div>
      </div>
    </transition>

    <div v-if="isAuthenticated" class="flex flex-col lg:flex-row min-h-screen relative">
      
      <!-- Mobile Navbar Toggle -->
      <div class="lg:hidden fixed top-6 right-6 z-[60]">
        <button @click="toggleSidebar" class="w-12 h-12 rounded-full bg-[#35bfa0] text-white shadow-xl flex items-center justify-center text-xl transition-transform active:scale-95">
          <i class="fas" :class="isSidebarOpen ? 'fa-times' : 'fa-bars'"></i>
        </button>
      </div>

      <!-- Sidebar -->
      <aside 
        class="fixed lg:sticky top-0 left-0 w-80 lg:w-85 h-screen bg-[var(--color-card)] backdrop-blur-3xl border-r border-[var(--color-border)] p-6 z-50 flex flex-col transition-all duration-500"
        :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      >
        <div class="flex items-center gap-4 mb-10 px-2 mt-4 lg:mt-0">
            <div class="w-10 h-10 rounded-xl bg-[#35bfa0] text-white flex items-center justify-center shadow-lg"><i class="fas fa-terminal"></i></div>
            <h1 class="text-xl font-black text-[var(--color-primary)] tracking-tight">Console<span class="font-light opacity-50">.hub</span></h1>
        </div>

        <div class="mb-8 space-y-3 px-2">
            <button @click="() => { publishChanges(); isSidebarOpen = false; }" :disabled="isPublishing" class="w-full flex items-center justify-center gap-3 bg-[#35bfa0] hover:bg-[#1fc9a8] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#35bfa0]/20 transition-all disabled:opacity-50">
                <i v-if="isPublishing" class="fas fa-sync fa-spin"></i>
                <i v-else class="fas fa-cloud-upload-alt"></i>
                {{ isPublishing ? '同步中...' : '发布到生产环境' }}
            </button>
            <button @click="() => {
                    activeTab === 'pinned' ? addPinnedItem() : activeTab === 'projects' ? addProject() : activeTab === 'commissions' ? addCommission() : activeTab === 'works' ? addWork() : addWorksSection();
                    isSidebarOpen = false;
                }" class="w-full flex items-center justify-center gap-3 bg-[var(--color-card-solid)] border border-[var(--color-border)] text-[#35bfa0] py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#35bfa0]/5 transition-all">
                <i class="fas fa-plus-circle"></i> 新增记录
            </button>
        </div>

        <div class="text-[10px] font-black text-[var(--color-secondary)] opacity-40 uppercase tracking-[0.2em] mb-4 px-4">Workspace</div>
        
        <nav class="space-y-2 mb-10 overflow-y-auto custom-scrollbar pr-2">
            <button 
                v-for="tab in tabs" 
                :key="tab.id"
                @click="() => { activeTab = tab.id; isSidebarOpen = false; }"
                class="w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group"
                :class="activeTab === tab.id ? 'bg-[#35bfa0]/10 text-[#35bfa0]' : 'text-[var(--color-secondary)] hover:bg-[#35bfa0]/5 hover:text-[var(--color-primary)]'"
            >
                <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-[var(--color-card-solid)] shadow-sm group-hover:scale-110">
                    <i class="fas" :class="tab.icon"></i>
                </div>
                <div class="text-left">
                    <p class="font-bold text-sm">{{ tab.name }}</p>
                    <p class="text-[10px] opacity-60 uppercase font-bold tracking-widest">{{ tab.file.split('.')[0] }}</p>
                </div>
            </button>
        </nav>

        <div class="mt-auto space-y-3 px-2 border-t border-[var(--color-border)] pt-8">
            <button @click="showSettings = true" class="w-full flex items-center gap-3 text-xs font-bold text-[var(--color-secondary)] hover:text-[#35bfa0] transition-colors">
                <i class="fas fa-sliders-h"></i> 存储配置
            </button>
            <button @click="logout" class="w-full flex items-center gap-3 text-xs font-bold text-red-400 hover:text-red-500 transition-colors">
                <i class="fas fa-sign-out-alt"></i> 退出登录
            </button>
        </div>
      </aside>

      <!-- Mobile Overlay -->
      <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"></div>

      <!-- Main Content Area -->
      <main class="flex-grow flex flex-col relative min-w-0">
        <div class="flex-grow overflow-y-auto px-6 md:px-12 pt-16 lg:pt-12 pb-32">
            <div class="mb-12">
                <div class="flex items-center gap-3 mb-2">
                    <i class="fas" :class="currentTabInfo?.icon + ' text-[#35bfa0] text-xl'"></i>
                    <h2 class="text-4xl font-black text-[var(--color-primary)] tracking-tight">{{ currentTabInfo?.name }}</h2>
                </div>
                <p class="text-[var(--color-secondary)] font-medium max-w-2xl text-sm md:text-base">{{ currentTabInfo?.desc }} — 管理并排序您的资产。</p>
            </div>

            <div v-if="isUploading" class="fixed bottom-12 right-12 z-50 bg-[#35bfa0] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-bounce">
                <i class="fas fa-shield-virus fa-spin"></i>
                <span class="text-xs font-bold uppercase tracking-widest">正在上传资产...</span>
            </div>

            <div class="grid grid-cols-1 gap-6 max-w-6xl">
                
                <!-- Pinned Items -->
                <template v-if="activeTab === 'pinned'">
                    <div v-for="(item, index) in pinnedItems" :key="index" class="card-flat group relative animate-fade-in-up">
                        <div class="absolute top-4 right-4 flex gap-2 transition-opacity z-20">
                            <button @click="moveUp(pinnedItems, index)" class="w-8 h-8 rounded-full bg-white/10 text-[var(--color-primary)] transition-all hover:bg-[#35bfa0] hover:text-white text-xs shadow-sm"><i class="fas fa-arrow-up"></i></button>
                            <button @click="moveDown(pinnedItems, index)" class="w-8 h-8 rounded-full bg-white/10 text-[var(--color-primary)] transition-all hover:bg-[#35bfa0] hover:text-white text-xs shadow-sm"><i class="fas fa-arrow-down"></i></button>
                            <button @click="removePinnedItem(index)" class="w-8 h-8 rounded-full bg-red-400/10 text-red-500 transition-all hover:bg-red-400 hover:text-white text-xs shadow-sm"><i class="fas fa-trash"></i></button>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 md:pt-0">
                            <div class="input-group"><label>标题</label><input v-model="item.title" class="input-modern" /></div>
                            <div class="input-group"><label>描述</label><input v-model="item.description" class="input-modern" /></div>
                            <div class="input-group"><label>跳转链接</label><input v-model="item.link" class="input-modern font-mono text-[10px]" /></div>
                        </div>
                    </div>
                </template>

                <!-- Projects -->
                <template v-if="activeTab === 'projects'">
                    <div v-for="(project, index) in projects" :key="index" class="card-flat group animate-fade-in-up relative flex flex-col md:flex-row gap-8">
                        <div class="absolute top-4 right-4 flex gap-2 transition-opacity z-20">
                            <button @click="moveUp(projects, index)" class="w-10 h-10 rounded-full bg-white/10 text-[var(--color-primary)] transition-all hover:bg-[#35bfa0] hover:text-white shadow-lg"><i class="fas fa-arrow-up"></i></button>
                            <button @click="moveDown(projects, index)" class="w-10 h-10 rounded-full bg-white/10 text-[var(--color-primary)] transition-all hover:bg-[#35bfa0] hover:text-white shadow-lg"><i class="fas fa-arrow-down"></i></button>
                            <button @click="removeProject(index)" class="w-10 h-10 rounded-full bg-red-500/10 text-red-500 transition-all hover:bg-red-500 hover:text-white shadow-lg"><i class="fas fa-trash"></i></button>
                        </div>
                        <div class="w-full md:w-64 flex-shrink-0 pt-10 md:pt-0">
                            <div class="aspect-video rounded-3xl overflow-hidden bg-[var(--color-bg)] border-2 border-dashed border-[var(--color-border)] relative group/img">
                                <img v-if="project.image" :src="resolveImg(project.image)" class="w-full h-full object-cover" />
                                <div v-else class="w-full h-full flex flex-col items-center justify-center text-[var(--color-secondary)] opacity-30"><i class="fas fa-image text-3xl mb-2"></i><span class="text-[10px] font-bold">PREVIEW</span></div>
                                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <label class="btn-brand !py-2 !px-4 text-[10px] cursor-pointer">
                                        更新图片
                                        <input type="file" class="hidden" accept="image/*" @change="(e) => handleFileUpload(e, project, 'image', 'img-projects')" />
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="flex-grow space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="input-group"><label>项目标题</label><input v-model="project.title" class="input-modern text-lg font-bold" /></div>
                                <div class="input-group"><label>技术栈 (逗号分隔)</label><input :value="project.tags.join(', ')" @input="(e) => project.tags = (e.target as HTMLInputElement).value.split(',').map(t => t.trim())" class="input-modern" /></div>
                            </div>
                            <div class="input-group"><label>详情描述</label><textarea v-model="project.description" class="input-modern h-24 pt-4"></textarea></div>
                        </div>
                    </div>
                </template>

                <!-- Commissions -->
                <template v-if="activeTab === 'commissions'">
                    <div class="card-flat group animate-fade-in-up p-6 mb-6">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-2xl flex items-center justify-center transition-all" :class="isBusinessOpen ? 'bg-[#35bfa0]/20 text-[#35bfa0]' : 'bg-red-500/20 text-red-500'">
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
                                :class="isBusinessOpen ? 'bg-[#35bfa0]' : 'bg-gray-400'"
                            >
                                <span 
                                    class="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-300"
                                    :class="isBusinessOpen ? 'left-9' : 'left-1'"
                                ></span>
                            </button>
                        </div>
                    </div>
                    <div v-for="(comm, index) in commissions" :key="index" class="card-flat group animate-fade-in-up p-8 relative">
                        <div class="absolute top-4 right-4 flex gap-2 transition-opacity z-20">
                            <button @click="moveUp(commissions, index)" class="w-10 h-10 rounded-full bg-white/10 text-[var(--color-primary)] transition-all hover:bg-[#35bfa0] hover:text-white shadow-lg"><i class="fas fa-arrow-up"></i></button>
                            <button @click="moveDown(commissions, index)" class="w-10 h-10 rounded-full bg-white/10 text-[var(--color-primary)] transition-all hover:bg-[#35bfa0] hover:text-white shadow-lg"><i class="fas fa-arrow-down"></i></button>
                            <button @click="removeCommission(index)" class="w-10 h-10 rounded-full bg-red-500/10 text-red-500 transition-all hover:bg-red-500 hover:text-white shadow-lg"><i class="fas fa-trash"></i></button>
                        </div>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-10 md:pt-0">
                            <div class="space-y-6">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="input-group"><label>服务名称</label><input v-model="comm.title" class="input-modern" /></div>
                                    <div class="input-group"><label>定价说明</label><input v-model="comm.price" class="input-modern font-bold text-[#35bfa0]" /></div>
                                </div>
                                <div class="input-group"><label>需求概括</label><input v-model="comm.requirements" class="input-modern" /></div>
                                <div class="input-group"><label>服务详情</label><textarea v-model="comm.description" class="input-modern h-32 pt-4"></textarea></div>
                            </div>
                            <div class="space-y-4">
                                <label class="text-[10px] font-black uppercase tracking-widest text-[#35bfa0]">预览图示</label>
                                <div class="grid grid-cols-3 gap-3">
                                    <div v-for="(img, i) in comm.images" :key="i" class="aspect-square rounded-2xl overflow-hidden bg-[var(--color-bg)] group/img relative shadow-sm">
                                        <img :src="resolveImg(img)" class="w-full h-full object-cover" />
                                        <button @click="comm.images.splice(i, 1)" class="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-[8px]"><i class="fas fa-times"></i></button>
                                    </div>
                                    <label class="aspect-square rounded-2xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center text-[var(--color-secondary)] hover:border-[#35bfa0] hover:text-[#35bfa0] cursor-pointer transition-all">
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
                    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        <div v-for="(work, index) in works" :key="work.id" class="card-flat group relative animate-fade-in-up !p-4">
                            <div class="absolute top-3 right-3 flex flex-col gap-1 z-20">
                                <button @click="moveUp(works, index)" class="w-7 h-7 rounded-sm bg-white/20 text-white hover:bg-[#35bfa0] shadow-md"><i class="fas fa-chevron-up"></i></button>
                                <button @click="moveDown(works, index)" class="w-7 h-7 rounded-sm bg-white/20 text-white hover:bg-[#35bfa0] shadow-md"><i class="fas fa-chevron-down"></i></button>
                                <button @click="removeWork(index)" class="w-7 h-7 rounded-sm bg-red-500 text-white shadow-md"><i class="fas fa-times"></i></button>
                            </div>
                            <div class="aspect-square rounded-2xl overflow-hidden bg-[var(--color-bg)] relative mb-4">
                                <img v-if="work.image" :src="resolveImg(work.image)" class="w-full h-full object-cover" />
                                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <label class="cursor-pointer text-white p-4">
                                        <i class="fas fa-cloud-upload-alt text-2xl"></i>
                                        <input type="file" class="hidden" @change="(e) => handleFileUpload(e, work, 'image', 'img-works')" />
                                    </label>
                                </div>
                            </div>
                            <input v-model="work.title" placeholder="标题" class="input-modern !text-xs font-bold mb-2" />
                            <div class="flex justify-between items-center mt-2">
                                <p class="text-[9px] opacity-40 font-mono">{{ work.id }}</p>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- Collections -->
                <template v-if="activeTab === 'works_section'">
                     <div v-for="(section, index) in worksSections" :key="section.id" class="card-flat group animate-fade-in-up">
                        <div class="flex flex-col md:flex-row gap-8">
                            <div class="w-32 flex-shrink-0">
                                <div class="aspect-square rounded-3xl overflow-hidden bg-[var(--color-bg)] relative shadow-inner border border-[var(--color-border)]">
                                    <img v-if="section.thumbnail" :src="resolveImg(section.thumbnail)" class="w-full h-full object-cover" />
                                    <label class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                        <i class="fas fa-camera text-white"></i>
                                        <input type="file" class="hidden" @change="(e) => handleFileUpload(e, section, 'thumbnail', 'img-works')" />
                                    </label>
                                </div>
                            </div>
                            <div class="flex-grow">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div class="input-group"><label>合集名称</label><input v-model="section.title" class="input-modern font-black text-xl" /></div>
                                    <div class="input-group"><label>引用键名</label><input v-model="section.id" class="input-modern font-mono text-xs opacity-60" /></div>
                                </div>
                                <div class="input-group"><label>简介说明</label><textarea v-model="section.description" class="input-modern h-20 pt-4"></textarea></div>
                            </div>
                            <div class="flex flex-row md:flex-col gap-2">
                                 <button @click="removeWorksSection(index)" class="btn-ghost !text-red-400 !border-red-400/20 hover:!bg-red-400 hover:!text-white py-2 shadow-sm"><i class="fas fa-trash"></i></button>
                                 <button @click="editingSectionId = editingSectionId === section.id ? null : section.id" 
                                         class="btn-ghost py-2" :class="editingSectionId === section.id ? 'btn-brand text-white' : ''">
                                     <i class="fas fa-layer-group"></i> 管理
                                 </button>
                            </div>
                        </div>

                        <div v-if="editingSectionId === section.id" class="mt-8 pt-8 border-t border-[var(--color-border)] animate-fade-in">
                             <div class="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3 max-h-96 overflow-y-auto pr-4 custom-scrollbar">
                                 <div v-for="work in works" :key="work.id" 
                                      @click="toggleWorkInSection(index, work.id)"
                                      class="aspect-square rounded-xl overflow-hidden cursor-pointer relative transition-all"
                                      :class="section.work_ids.includes(work.id) ? 'ring-4 ring-[#35bfa0] scale-95 opacity-100' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'"
                                 >
                                      <img :src="resolveImg(work.image)" class="w-full h-full object-cover" />
                                      <div v-if="section.work_ids.includes(work.id)" class="absolute inset-0 flex items-center justify-center bg-[#35bfa0]/20">
                                          <i class="fas fa-check-circle text-white text-2xl shadow-lg"></i>
                                      </div>
                                 </div>
                             </div>
                        </div>
                     </div>
                </template>

            </div>
        </div>
      </main>

       <!-- Settings Modal -->
    <transition name="fade">
        <div v-if="showSettings" class="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-xl px-4">
            <div class="card max-w-lg w-full p-10 relative">
                <button @click="showSettings = false" class="absolute top-6 right-6 text-[var(--color-secondary)] hover:text-red-500"><i class="fas fa-times"></i></button>
                <h3 class="text-2xl font-black mb-8 text-[var(--color-primary)]">GitHub 存储配置</h3>
                <div class="space-y-6">
                    <div class="input-group">
                        <label>Token</label>
                        <input v-model="githubConfig.token" type="password" class="input-modern" placeholder="ghp_xxxx" />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="input-group"><label>Owner</label><input v-model="githubConfig.owner" class="input-modern" /></div>
                        <div class="input-group"><label>Repo</label><input v-model="githubConfig.repo" class="input-modern" /></div>
                    </div>
                    <button @click="saveSettings" class="btn-brand w-full py-4 mt-4">确认保存</button>
                </div>
            </div>
        </div>
    </transition>

    </div>
  </div>
</template>

<style scoped>
.input-modern {
    width: 100%;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: 1rem;
    padding: 0.75rem 1.25rem;
    color: var(--color-primary);
    font-size: 0.875rem;
    transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.input-modern:focus {
    outline: none;
    border-color: #35bfa0;
    background: var(--color-card-solid);
}

.input-group label {
    display: block;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-secondary);
    margin-bottom: 0.6rem;
    padding-left: 0.5rem;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(53, 191, 160, 0.2);
  border-radius: 10px;
}
</style>
